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

// Track connection readiness
let isConnected = false;

// Pending messages queue (for when WhatsApp disconnects during an alert)
const pendingMessages: Array<{ groupId: string; text: string }> = [];

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
  onMessage?: MessageHandler
): Promise<void> {
  if (onMessage) {
    messageHandler = onMessage;
  }

  // Load auth credentials from Supabase
  const authState = await useSupabaseAuthState();
  if (!authState) {
    log.error('Failed to initialize auth state - cannot connect');
    throw new Error('Auth state initialization failed');
  }

  const { state, saveCreds } = authState;

  // Get latest Baileys version for compatibility
  const { version } = await fetchLatestBaileysVersion();
  log.info({ version }, 'Using Baileys version');

  // Create the WhatsApp socket
  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }) as any, // Silence Baileys internal logs
    printQRInTerminal: false, // We handle QR display ourselves
    auth: {
      creds: state.creds,
      keys: state.keys,
    },
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined, // Required by Baileys for message retries
    // Stability settings (learned from production usage)
    syncFullHistory: false,
    markOnlineOnConnect: false, // Prevents "440 session conflict" errors
    fireInitQueries: false, // Reduces connection errors
    shouldIgnoreJid: (jid: string) => jid?.endsWith('@broadcast'),
    retryRequestDelayMs: 5000,
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

  // ---- Event: Incoming Messages ----
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Only process new messages, not history sync
    if (type !== 'notify') return;

    for (const message of messages) {
      const chatId = message.key.remoteJid;
      const body = getMessageBody(message);

      // Skip bot's own messages
      if (message.key.fromMe) {
        // Still save bot's outgoing messages for conversation history
        if (chatId && body) {
          saveMessage({
            id: message.key.id || `bot-${Date.now()}`,
            chat_id: chatId,
            chat_name: null,
            sender_name: 'Echo',
            sender_number: sock?.user?.id?.split('@')[0]?.split(':')[0] || null,
            message_type: 'text',
            body,
            timestamp: (message.messageTimestamp as number) || Math.floor(Date.now() / 1000),
            from_me: true,
            is_group: chatId.endsWith('@g.us'),
            is_content: true,
          }).catch(() => {}); // Fire and forget
        }
        continue;
      }

      if (!chatId) continue;

      // Only process group messages
      const isGroup = chatId.endsWith('@g.us');
      if (!isGroup) continue;

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
        is_group: true,
        is_content: true,
      }).catch(() => {}); // Fire and forget

      // Build the incoming message object
      const incoming: IncomingMessage = {
        chatId,
        senderJid,
        senderName: message.pushName || 'Unknown',
        body,
        isGroup,
        timestamp: message.messageTimestamp as number,
        mentionedJids: getMessageMentions(message),
        quotedParticipant: getQuotedParticipant(message),
      };

      // Call the message handler (command processor)
      if (messageHandler) {
        try {
          await messageHandler(incoming);
        } catch (err) {
          log.error({ err, chatId }, 'Error in message handler');
        }
      }
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
    await sock.sendMessage(groupId, { text });
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
        await sock.sendMessage(msg.groupId, { text: msg.text });
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
 * Extract mentioned JIDs from a message's contextInfo.
 */
function getMessageMentions(message: WAMessage): string[] | undefined {
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
    return ctx.mentionedJid;
  }
  return undefined;
}

/**
 * Extract the quoted message's participant (who sent the message being replied to).
 */
function getQuotedParticipant(message: WAMessage): string | undefined {
  const ctx = message.message?.extendedTextMessage?.contextInfo;
  return ctx?.participant || undefined;
}

/** Check if WhatsApp is currently connected */
export function isWhatsAppConnected(): boolean {
  return isConnected;
}

/** Get the bot's own JID (for detecting mentions/replies to the bot) */
export function getBotJid(): string | undefined {
  return sock?.user?.id;
}

/** Get the current socket instance (for advanced usage) */
export function getSocket(): WASocket | null {
  return sock;
}

/** Get the number of pending messages in the queue */
export function getPendingMessageCount(): number {
  return pendingMessages.length;
}
