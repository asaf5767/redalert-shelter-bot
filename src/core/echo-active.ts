/**
 * Echo Active Participation — makes Echo occasionally jump into group conversations unprompted.
 *
 * Flow:
 * 1. Every non-trigger group message increments a per-group counter
 * 2. After 5 messages, probability check starts (15% base, +10% per extra message)
 * 3. If probability hits, Groq gating decides if the conversation is worth joining
 * 4. If Groq says yes, full AI generates a response with the suggested angle
 * 5. 15-minute cooldown between unprompted responses per group
 *
 * Controlled by ECHO_ACTIVE_MODE env var (default: false).
 */

import { IncomingMessage } from '../types';
import { ECHO_ACTIVE_MODE, BOT_PHONE_NUMBER } from '../config';
import { shouldEchoJumpIn, askAI, isAIEnabled } from '../services/ai';
import { getConversationHistory, saveMessage } from '../services/supabase';
import { sendGroupMessage, getBotJid } from '../services/whatsapp';
import { getGroupConfig } from './group-config';
import { createLogger } from '../utils/logger';

const log = createLogger('echo-active');

// =====================
// Constants
// =====================

/** Minimum messages before Echo considers jumping in */
const MESSAGE_THRESHOLD = 5;

/** Base probability at threshold (15%) */
const BASE_PROBABILITY = 0.15;

/** Probability increase per message beyond threshold (10%) */
const PROBABILITY_INCREMENT = 0.10;

/** Maximum probability cap (never 100% — always some randomness) */
const MAX_PROBABILITY = 0.85;

/** Cooldown between unprompted responses per group (15 minutes) */
const COOLDOWN_MS = 15 * 60 * 1000;

/** Max recent messages to send to the gating prompt */
const GATE_CONTEXT_SIZE = 5;

// =====================
// Per-group State
// =====================

interface GroupActiveState {
  /** Messages since last active response (or since bot started tracking) */
  messageCount: number;
  /** Timestamp of last unprompted response */
  lastActiveResponseAt: number;
  /** Recent messages (sender: body) for gating context */
  recentMessages: string[];
  /** Lock to prevent concurrent active responses */
  responding: boolean;
}

const groupStates = new Map<string, GroupActiveState>();

function getOrCreateState(groupId: string): GroupActiveState {
  let state = groupStates.get(groupId);
  if (!state) {
    state = { messageCount: 0, lastActiveResponseAt: 0, recentMessages: [], responding: false };
    groupStates.set(groupId, state);
  }
  return state;
}

// =====================
// Public API
// =====================

/**
 * Called for every incoming group message (from command-handler).
 * Tracks the message and may trigger an active response.
 * This is fire-and-forget — errors are logged but don't propagate.
 */
export async function onGroupMessage(message: IncomingMessage): Promise<void> {
  if (!ECHO_ACTIVE_MODE || !message.isGroup || !isAIEnabled()) return;

  const state = getOrCreateState(message.chatId);

  // Track the message
  state.messageCount++;
  const senderLabel = message.senderName || 'משתמש';
  state.recentMessages.push(`${senderLabel}: ${message.body}`);

  // Keep only the last N messages for context
  if (state.recentMessages.length > GATE_CONTEXT_SIZE) {
    state.recentMessages = state.recentMessages.slice(-GATE_CONTEXT_SIZE);
  }

  // Check if we should attempt an active response
  if (!shouldAttempt(message.chatId, state)) return;

  // Roll the dice (capped at MAX_PROBABILITY)
  const messagesOverThreshold = state.messageCount - MESSAGE_THRESHOLD;
  const probability = Math.min(
    BASE_PROBABILITY + messagesOverThreshold * PROBABILITY_INCREMENT,
    MAX_PROBABILITY
  );
  const roll = Math.random();

  log.debug(
    { groupId: message.chatId, messageCount: state.messageCount, probability, roll },
    'Active response probability check'
  );

  if (roll > probability) return;

  // Acquire the responding lock to prevent concurrent active responses
  if (state.responding) return;
  state.responding = true;

  // Probability hit! Ask Groq if we should actually respond
  log.info(
    { groupId: message.chatId, messageCount: state.messageCount },
    'Probability hit — asking Groq gate'
  );

  try {
    const gateResult = await shouldEchoJumpIn(state.recentMessages);

    if (!gateResult.shouldRespond) {
      log.info({ groupId: message.chatId }, 'Groq gate said NO — skipping');
      // Reset counter to avoid hot loop of Groq calls on every subsequent message
      state.messageCount = 0;
      state.recentMessages = [];
      return;
    }

    log.info(
      { groupId: message.chatId, angle: gateResult.angle },
      'Groq gate said YES — generating active response'
    );

    await generateAndSendActiveResponse(message.chatId, gateResult.angle || 'reaction');

    // Reset state after responding
    state.messageCount = 0;
    state.lastActiveResponseAt = Date.now();
    state.recentMessages = [];
  } catch (err) {
    log.error({ err, groupId: message.chatId }, 'Active response failed');
  } finally {
    state.responding = false;
  }
}

// =====================
// Internal Helpers
// =====================

/**
 * Check preconditions before attempting an active response.
 */
function shouldAttempt(groupId: string, state: GroupActiveState): boolean {
  // Not enough messages yet
  if (state.messageCount < MESSAGE_THRESHOLD) return false;

  // Cooldown hasn't expired
  if (Date.now() - state.lastActiveResponseAt < COOLDOWN_MS) {
    log.debug({ groupId }, 'Active response on cooldown');
    return false;
  }

  return true;
}

/**
 * Generate a full AI response and send it to the group.
 */
async function generateAndSendActiveResponse(
  groupId: string,
  angle: string
): Promise<void> {
  const config = getGroupConfig(groupId);
  const lang = config?.language || 'he';

  // Build bot number list for identifying bot messages in history
  const botNumbers: string[] = [];
  const botJid = getBotJid();
  if (botJid) botNumbers.push(botJid.split('@')[0].split(':')[0]);
  if (BOT_PHONE_NUMBER) botNumbers.push(BOT_PHONE_NUMBER);

  // Fetch recent conversation history from DB
  const history = await getConversationHistory(groupId, botNumbers, 10);

  // Build the prompt with the suggested angle
  const anglePrompts: Record<string, string> = {
    joke: lang === 'he'
      ? 'תקפוץ לשיחה עם בדיחה או תגובה מצחיקה שקשורה למה שדיברו עליו.'
      : 'Jump into the conversation with a joke or funny remark related to what they discussed.',
    opinion: lang === 'he'
      ? 'תקפוץ לשיחה עם דעה חזקה (אפשר גם שנויה במחלוקת) על מה שדיברו עליו.'
      : 'Jump into the conversation with a strong (even controversial) opinion on what they discussed.',
    fact: lang === 'he'
      ? 'תקפוץ לשיחה עם עובדה מעניינת או פרט מפתיע שקשור למה שדיברו עליו.'
      : 'Jump into the conversation with an interesting fact or surprising detail related to what they discussed.',
    reaction: lang === 'he'
      ? 'תקפוץ לשיחה עם תגובה טבעית וספונטנית למה שדיברו עליו, כאילו אתה חבר שפשוט לא יכל להתאפק.'
      : 'Jump into the conversation with a natural, spontaneous reaction, like a friend who just couldn\'t hold back.',
  };

  const angleInstruction = anglePrompts[angle] || anglePrompts.reaction;
  const prompt = `${angleInstruction}\nאתה קופץ לשיחה בעצמך — אף אחד לא שאל אותך. תהיה טבעי ולא תגיד "ראיתי שדיברתם על..." — פשוט תכנס ישר.`;

  const response = await askAI(prompt, history);
  const fullResponse = `🤖 ${response}`;

  await sendGroupMessage(groupId, fullResponse);

  // Save to DB for conversation continuity
  const botJidNum = getBotJid()?.split('@')[0]?.split(':')[0] || BOT_PHONE_NUMBER || 'bot';
  saveMessage({
    id: `echo-active-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chat_id: groupId,
    chat_name: null,
    sender_name: 'Echo',
    sender_number: botJidNum,
    message_type: 'text',
    body: fullResponse,
    timestamp: Math.floor(Date.now() / 1000),
    from_me: true,
    is_group: groupId.endsWith('@g.us'),
    is_content: true,
  }).catch(() => {}); // Fire and forget

  log.info({ groupId, angle }, 'Active response sent successfully');
}
