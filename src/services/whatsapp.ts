/**
 * WhatsApp Service - Baileys connection management
 *
 * Handles:
 * - Connecting to WhatsApp via Baileys (WhatsApp Web protocol)
 * - QR code display for authentication
 * - Automatic reconnection with exponential backoff
 * - Sending messages to groups
 * - Listening for incoming messages
 */

import makeWASocket, {
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  WAMessage,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal');
import pino from 'pino';
import { useSupabaseAuthState, saveMessage, WhatsAppMessageRow } from './supabase';
import { createLogger } from '../utils/logger';
import { MessageHandler, IncomingMessage } from '../types';

const log = createLogger('whatsapp');

// Connection state
let sock: WASocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;

// Message handler callback
let messageHandler: MessageHandler | null = null;

// Group-join handler callback
let groupJoinHandler: ((groupId: string) => Promise<void>) | null = null;

// Track connection readiness
let isConnected = false;

// Pending messages queue (for when WhatsApp disconnects during an alert)
const pendingMessages: Array<{ groupId: string; text: string }> = [];

// Message dedup: prevents processing the same message twice.
// Baileys can deliver duplicates during session renegotiation.
const processedMessageIds = new Map<string, number>(); // messageId -> timestamp
const MESSAGE_DEDUP_TTL_MS = 60_000; // 60 seconds

// LID → phone number mapping for personal chats.
// WhatsApp sends some DMs with a @lid chatId instead of a phone @s.whatsapp.net chatId.
// When message.key.senderPn is present we can resolve it; we cache the result so
// subsequent messages without senderPn still get routed to the correct phone-JID entry.
const lidToPhoneMap = new Map<string, string>(); // lid_number → phone_number (digits only)

// Store outgoing messages so Baileys can resend them on retry requests.
// When a recipient fails to decrypt a message, WhatsApp asks the sender to re-encrypt
// and resend. Without this store, getMessage returns undefined and the retry silently fails,
// causing "failed to decrypt message" errors on the other end.
const sentMessageStore = new Map<string, { message: any; timestamp: number }>();
const SENT_MSG_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// =====================
// Connection
// =====================

/**
 * Connect to WhatsApp using Baileys.
 *
 * This will:
 * 1. Load credentials from Supabase (or create new ones)
 * 2. Display a QR code in the terminal if needed
 * 3. Establish the WhatsApp Web connection
 * 4. Set up auto-reconnection on disconnect
 *
 * @param onConnected - Called when connection is established
 * @param onMessage - Called for each incoming text message
 */
export async function connectToWhatsApp(
  onConnected?: () => void,
  onMessage?: MessageHandler,
  onGroupJoin?: (groupId: string) => Promise<void>
): Promise<void> {
  if (onMessage) {
    messageHandler = onMessage;
  }
  if (onGroupJoin) {
    groupJoinHandler = onGroupJoin;
  }

  // Clean up previous socket before creating a new one.
  // Without this, reconnections accumulate event listeners on old sockets,
  // causing duplicate message processing.
  if (sock) {
    log.info('Cleaning up previous socket before reconnecting');
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.ev.removeAllListeners('group-participants.update');
      sock.end(undefined);
    } catch (err) {
      log.warn({ err }, 'Error cleaning up old socket (non-fatal)');
    }
    sock = null;
  }

  // Load auth credentials: try Supabase first, fall back to local files
  let authState = await useSupabaseAuthState();

  if (!authState) {
    log.info('Using file-based auth (auth_info/) — session stored locally');
    authState = await useMultiFileAuthState('./auth_info');
  }

  const { state, saveCreds } = authState;

  // Wrap signal keys with in-memory cache to prevent race conditions
  // during concurrent message decryption (prevents "Bad MAC" errors)
  const cachedKeys = makeCacheableSignalKeyStore(
    state.keys,
    pino({ level: 'warn' }) as any
  );

  // Get latest Baileys version for compatibility
  const { version } = await fetchLatestBaileysVersion();
  log.info({ version }, 'Using Baileys version');

  // Create the WhatsApp socket
  sock = makeWASocket({
    version,
    logger: pino({ level: 'warn' }) as any, // Show decryption errors and session warnings
    printQRInTerminal: false, // We handle QR display ourselves
    auth: {
      creds: state.creds,
      keys: cachedKeys,
    },
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      const entry = sentMessageStore.get(key.id!);
      if (entry) {
        log.debug({ msgId: key.id }, 'getMessage: returning stored message for retry');
        return entry.message;
      }
      log.debug({ msgId: key.id }, 'getMessage: message not found in store');
      return undefined;
    },
    // Stability settings (learned from production usage)
    syncFullHistory: false,
    markOnlineOnConnect: false, // Prevents "440 session conflict" errors
    fireInitQueries: false, // Reduces connection errors
    shouldIgnoreJid: (jid: string) => jid?.endsWith('@broadcast'),
    retryRequestDelayMs: 250,
    connectTimeoutMs: 120000,
    keepAliveIntervalMs: 25000,
    qrTimeout: 120000,
    defaultQueryTimeoutMs: 90000,
    emitOwnEvents: false,
  });

  // ---- Event: Connection State Changes ----
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Show QR code when needed
    if (qr) {
      console.log('\n========================================');
      console.log('  Scan this QR code with WhatsApp:');
      console.log('========================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device\n');
    }

    // Connected successfully
    if (connection === 'open') {
      isConnected = true;
      reconnectAttempts = 0;
      log.info('WhatsApp connected successfully!');
      log.info({ botJid: sock?.user?.id, botLid: (sock?.user as any)?.lid }, 'Bot identity');

      // Send any pending messages that were queued during disconnect
      await flushPendingMessages();

      if (onConnected) {
        onConnected();
      }
    }

    // Connection closed - handle reconnection
    if (connection === 'close') {
      isConnected = false;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      log.warn(
        { statusCode, shouldReconnect, attempt: reconnectAttempts },
        'WhatsApp disconnected'
      );

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;

        // Exponential backoff: 5s, 10s, 20s, 40s... up to 5 min
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 300000);

        log.info({ delay: delay / 1000 }, 'Reconnecting in %d seconds...');
        setTimeout(() => connectToWhatsApp(onConnected, messageHandler || undefined), delay);
      } else if (statusCode === DisconnectReason.loggedOut) {
        log.error(
          'Logged out of WhatsApp! You need to scan the QR code again.'
        );
        log.error('Delete auth state from Supabase and restart the bot.');
      } else {
        log.error(
          { attempts: reconnectAttempts },
          'Max reconnection attempts reached. Exiting.'
        );
        process.exit(1);
      }
    }
  });

  // ---- Event: Save Credentials ----
  sock.ev.on('creds.update', saveCreds);

  // ---- Event: Group Participants Changed ----
  // Fires when participants are added/removed. Used to detect when the bot joins a group.
  sock.ev.on('group-participants.update', async ({ id, participants, action }: { id: string; participants: string[]; action: string }) => {
    if (action !== 'add') return;
    if (!groupJoinHandler) return;

    // Check if the bot itself is among the added participants
    const extractId = (j: string) => j.split('@')[0].split(':')[0];
    const botId = sock?.user?.id ? extractId(sock.user.id) : null;
    const botLid = (sock?.user as any)?.lid ? extractId((sock!.user as any).lid) : null;

    const botWasAdded = participants.some((p: string) => {
      const pid = extractId(p);
      return (botId && botId === pid) || (botLid && botLid === pid);
    });

    if (botWasAdded) {
      log.info({ groupId: id }, 'Bot was added to a group — sending welcome');
      try {
        await groupJoinHandler(id);
      } catch (err) {
        log.error({ err, groupId: id }, 'Error in group-join handler');
      }
    }
  });

  // ---- Event: Incoming Messages ----
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Only process new messages, not history sync
    if (type !== 'notify') return;

    // Dedup first, then process all messages concurrently.
    // Sequential `await` in a loop caused the second message to be
    // dropped when two messages arrived in quick succession (the handler
    // for message 1 — especially AI calls — blocked message 2).
    const toProcess: Array<{ message: typeof messages[0]; incoming: IncomingMessage }> = [];

    for (const message of messages) {
      // Dedup: skip messages we have already processed.
      // Protects against Baileys delivering the same message twice
      // during session renegotiation.
      const msgId = message.key.id;
      if (msgId) {
        const now = Date.now();
        if (processedMessageIds.has(msgId)) {
          log.debug({ msgId }, 'Skipping duplicate message');
          continue;
        }
        processedMessageIds.set(msgId, now);

        // Periodic cleanup: evict expired entries when the map grows large
        if (processedMessageIds.size > 500) {
          for (const [id, ts] of processedMessageIds) {
            if (now - ts > MESSAGE_DEDUP_TTL_MS) processedMessageIds.delete(id);
          }
        }
      }

      const chatId = message.key.remoteJid;
      const body = getMessageBody(message);

      // Skip bot's own messages (emitOwnEvents is false, so this rarely fires,
      // but keep as safety net. Bot responses are saved directly in command-handler.)
      if (message.key.fromMe) continue;

      if (!chatId) continue;

      // Identify whether this is a group or personal chat
      const isGroup = chatId.endsWith('@g.us');

      // For DMs with LID format, resolve to phone-based JID for sending replies.
      // Baileys can't send to @lid addresses — need @s.whatsapp.net format.
      // We also cache LID→phone mappings so commands always hit the phone-JID config
      // entry even when senderPn is absent (e.g. after a reconnect).
      let replyChatId = chatId;
      if (!isGroup && chatId.endsWith('@lid')) {
        const keyAny = message.key as any;
        const lidNumber = chatId.split('@')[0].split(':')[0];
        if (keyAny.senderPn) {
          const phone = keyAny.senderPn.split('@')[0].split(':')[0];
          replyChatId = `${phone}@s.whatsapp.net`;
          lidToPhoneMap.set(lidNumber, phone); // Cache for future messages
        } else if (lidToPhoneMap.has(lidNumber)) {
          replyChatId = `${lidToPhoneMap.get(lidNumber)!}@s.whatsapp.net`;
        }
      }

      // Extract text content from the message
      if (!body) continue;

      const senderJid = message.key.participant || message.key.remoteJid || '';

      // Save incoming message to DB for conversation history
      saveMessage({
        id: message.key.id || `msg-${Date.now()}`,
        chat_id: chatId,
        chat_name: null,
        sender_name: message.pushName || 'Unknown',
        sender_number: senderJid.split('@')[0].split(':')[0],
        message_type: 'text',
        body,
        timestamp: (message.messageTimestamp as number) || Math.floor(Date.now() / 1000),
        from_me: false,
        is_group: isGroup,
        is_content: true,
      }).catch(() => {}); // Fire and forget

      // Build the incoming message object
      const incoming: IncomingMessage = {
        chatId: replyChatId,
        senderJid,
        senderName: message.pushName || 'Unknown',
        body,
        isGroup,
        timestamp: message.messageTimestamp as number,
        mentionedJids: getMessageMentions(message),
        quotedParticipant: getQuotedParticipant(message),
        messageKey: {
          remoteJid: chatId,
          fromMe: false,
          id: message.key.id || '',
          participant: message.key.participant || undefined,
        },
      };

      toProcess.push({ message, incoming });
    }

    // Process all messages concurrently — no message waits for another
    if (messageHandler && toProcess.length > 0) {
      await Promise.allSettled(
        toProcess.map(({ incoming }) =>
          messageHandler!(incoming).catch(err =>
            log.error({ err, chatId: incoming.chatId }, 'Error in message handler')
          )
        )
      );
    }
  });
}

// =====================
// Message Sending
// =====================

/**
 * Send a text message to a WhatsApp group.
 * If not connected, queues the message for later delivery.
 */
export async function sendGroupMessage(
  groupId: string,
  text: string
): Promise<boolean> {
  if (!sock || !isConnected) {
    log.warn({ groupId }, 'WhatsApp not connected - queuing message');
    pendingMessages.push({ groupId, text });
    return false;
  }

  try {
    const sent = await sock.sendMessage(groupId, { text });

    // Store sent message so Baileys can resend on retry requests
    if (sent?.key?.id && sent.message) {
      sentMessageStore.set(sent.key.id, { message: sent.message, timestamp: Date.now() });
      cleanupSentMessageStore();
    }

    log.info({ groupId, textLength: text.length }, 'Message sent to group');
    return true;
  } catch (err) {
    log.error({ err, groupId }, 'Failed to send message');
    // Queue for retry
    pendingMessages.push({ groupId, text });
    return false;
  }
}

/**
 * Send all queued messages that accumulated during disconnection.
 */
async function flushPendingMessages(): Promise<void> {
  if (pendingMessages.length === 0) return;

  log.info(
    { count: pendingMessages.length },
    'Sending queued messages...'
  );

  // Copy and clear the queue
  const toSend = [...pendingMessages];
  pendingMessages.length = 0;

  for (const msg of toSend) {
    try {
      if (sock && isConnected) {
        const sent = await sock.sendMessage(msg.groupId, { text: msg.text });

        // Store sent message so Baileys can resend on retry requests
        if (sent?.key?.id && sent.message) {
          sentMessageStore.set(sent.key.id, { message: sent.message, timestamp: Date.now() });
        }

        log.info({ groupId: msg.groupId }, 'Queued message sent');
      }
    } catch (err) {
      log.error({ err, groupId: msg.groupId }, 'Failed to send queued message');
    }
  }
}

// =====================
// Helpers
// =====================

/**
 * Extract the text body from a Baileys WAMessage object.
 * Handles regular text, extended text (with mentions/links), and captions.
 */
function getMessageBody(message: WAMessage): string | null {
  const msg = message.message;
  if (!msg) return null;

  // Plain text message
  if (msg.conversation) return msg.conversation;

  // Text with mentions, links, or replies
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;

  // Image/video with caption
  if (msg.imageMessage?.caption) return msg.imageMessage.caption;
  if (msg.videoMessage?.caption) return msg.videoMessage.caption;

  return null;
}

/**
 * Extract contextInfo from any message type that may carry it.
 * Replies and mentions can arrive via extendedText, ephemeral, image, video, etc.
 */
function getContextInfo(message: WAMessage): any | undefined {
  const msg = message.message;
  if (!msg) return undefined;

  return msg.extendedTextMessage?.contextInfo
    || msg.ephemeralMessage?.message?.extendedTextMessage?.contextInfo
    || msg.imageMessage?.contextInfo
    || msg.videoMessage?.contextInfo
    || undefined;
}

/**
 * Extract mentioned JIDs from a message's contextInfo.
 */
function getMessageMentions(message: WAMessage): string[] | undefined {
  const ctx = getContextInfo(message);
  if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
    return ctx.mentionedJid;
  }
  return undefined;
}

/**
 * Extract the quoted message's participant (who sent the message being replied to).
 */
function getQuotedParticipant(message: WAMessage): string | undefined {
  const ctx = getContextInfo(message);
  return ctx?.participant || undefined;
}

/** Check if WhatsApp is currently connected */
export function isWhatsAppConnected(): boolean {
  return isConnected;
}

/**
 * Evict expired entries from the sent message store.
 * Called after storing a new message to keep memory bounded.
 */
function cleanupSentMessageStore(): void {
  if (sentMessageStore.size > 200) {
    const now = Date.now();
    for (const [id, entry] of sentMessageStore) {
      if (now - entry.timestamp > SENT_MSG_TTL_MS) sentMessageStore.delete(id);
    }
  }
}

/**
 * React to a message with an emoji.
 * Non-fatal — silently fails if connection is down.
 */
export async function reactToMessage(
  messageKey: { remoteJid: string; fromMe: boolean; id: string; participant?: string },
  emoji: string
): Promise<void> {
  if (!sock || !isConnected) return;
  try {
    await sock.sendMessage(messageKey.remoteJid, {
      react: { text: emoji, key: messageKey },
    });
  } catch {
    // Non-fatal — don't break the flow if reaction fails
  }
}

/** Get the bot's own JID (for detecting mentions/replies to the bot) */
export function getBotJid(): string | undefined {
  return sock?.user?.id;
}

/** Get the bot's LID (internal WhatsApp ID, used in replies) */
export function getBotLid(): string | undefined {
  return (sock?.user as any)?.lid || undefined;
}

/** Get the current socket instance (for advanced usage) */
export function getSocket(): WASocket | null {
  return sock;
}

/** Get the number of pending messages in the queue */
export function getPendingMessageCount(): number {
  return pendingMessages.length;
}

/**
 * Show "typing..." indicator in a chat.
 * Non-fatal — silently fails if connection is down.
 */
export async function sendTypingIndicator(chatId: string): Promise<void> {
  if (!sock || !isConnected) return;
  try {
    await sock.sendPresenceUpdate('composing', chatId);
  } catch {
    // Non-fatal — don't break the flow
  }
}

/**
 * Stop the typing indicator in a chat.
 * Non-fatal — silently fails if connection is down.
 */
export async function stopTypingIndicator(chatId: string): Promise<void> {
  if (!sock || !isConnected) return;
  try {
    await sock.sendPresenceUpdate('paused', chatId);
  } catch {
    // Non-fatal — don't break the flow
  }
}

/**
 * Show "recording audio..." indicator in a chat.
 * Non-fatal — silently fails if connection is down.
 */
export async function sendRecordingIndicator(chatId: string): Promise<void> {
  if (!sock || !isConnected) return;
  try {
    await sock.sendPresenceUpdate('recording', chatId);
  } catch {
    // Non-fatal — don't break the flow
  }
}

/**
 * Send an audio file as a voice note (push-to-talk) in a WhatsApp chat.
 * The file must be in OGG/Opus format.
 */
export async function sendVoiceNote(
  chatId: string,
  oggPath: string
): Promise<boolean> {
  if (!sock || !isConnected) {
    log.warn({ chatId }, 'WhatsApp not connected - cannot send voice note');
    return false;
  }

  try {
    const sent = await sock.sendMessage(chatId, {
      audio: { url: oggPath },
      ptt: true,
      mimetype: 'audio/ogg; codecs=opus',
    });

    // Store sent message for retry requests (same as text messages)
    if (sent?.key?.id && sent.message) {
      sentMessageStore.set(sent.key.id, { message: sent.message, timestamp: Date.now() });
      cleanupSentMessageStore();
    }

    log.info({ chatId }, 'Voice note sent');
    return true;
  } catch (err) {
    log.error({ err, chatId }, 'Failed to send voice note');
    return false;
  }
}
