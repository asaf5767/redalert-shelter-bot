/**
 * Echo Active Participation — topic-aware engagement system.
 *
 * Instead of counter+probability, Echo behaves like a real group member:
 * notices interesting topics, jumps in, stays engaged for a bit, then goes quiet.
 *
 * State machine per group:
 *   LURKING → (3 msgs accumulated, Groq says INTERESTING) → ENGAGED
 *   ENGAGED → (window expires OR max follow-ups OR topic dies) → COOLDOWN
 *   COOLDOWN → (10 min passes) → LURKING
 *
 * Controlled by ECHO_ACTIVE_MODE env var (default: false).
 */

import { IncomingMessage } from '../types';
import { ECHO_ACTIVE_MODE, BOT_PHONE_NUMBER } from '../config';
import { shouldEchoEngage, askAI, isAIEnabled, extractReactionEmoji } from '../services/ai';
import { getConversationHistory, saveMessage } from '../services/supabase';
import { sendGroupMessage, getBotJid, sendTypingIndicator } from '../services/whatsapp';
import { getGroupConfig } from './group-config';
import { createLogger } from '../utils/logger';

const log = createLogger('echo-active');

// =====================
// Constants
// =====================

/** Messages to accumulate before asking Groq if the topic is interesting */
const LURK_BUFFER_SIZE = 3;

/** Max engagement window from first response (5 minutes) */
const ENGAGEMENT_WINDOW_MS = 5 * 60 * 1000;

/** If no messages arrive for this long during engagement, conversation died (2 minutes) */
const CONVERSATION_DIED_MS = 2 * 60 * 1000;

/** Probability of a follow-up response during ENGAGED state (40%) */
const FOLLOW_UP_CHANCE = 0.40;

/** Max follow-up responses per engagement (so max 4 total: 1 initial + 3 follow-ups) */
const MAX_FOLLOW_UPS = 3;

/** Cooldown between engagements per group (10 minutes) */
const COOLDOWN_MS = 10 * 60 * 1000;

/** Max recent messages to keep in buffer for Groq gating context */
const BUFFER_CONTEXT_SIZE = 8;

// =====================
// State Types
// =====================

type GroupPhase = 'LURKING' | 'ENGAGED' | 'COOLDOWN';

interface GroupEngagementState {
  phase: GroupPhase;

  /** Message buffer for Groq gating (sender: body lines) */
  messageBuffer: string[];

  /** Lock to prevent concurrent AI calls */
  responding: boolean;

  // --- ENGAGED state fields ---
  /** When the engagement window started (first response sent) */
  engagedSince: number;
  /** Timestamp of the last message received in the group */
  lastMessageAt: number;
  /** How many follow-ups Echo has sent in this engagement */
  followUpCount: number;
  /** The topic/angle Echo is currently engaged on */
  currentAngle: string;

  // --- COOLDOWN state fields ---
  /** When cooldown started */
  cooldownSince: number;
}

const groupStates = new Map<string, GroupEngagementState>();

function getOrCreateState(groupId: string): GroupEngagementState {
  let state = groupStates.get(groupId);
  if (!state) {
    state = {
      phase: 'LURKING',
      messageBuffer: [],
      responding: false,
      engagedSince: 0,
      lastMessageAt: 0,
      followUpCount: 0,
      currentAngle: '',
      cooldownSince: 0,
    };
    groupStates.set(groupId, state);
  }
  return state;
}

// =====================
// Public API
// =====================

/**
 * Called for every incoming group message (from command-handler).
 * Tracks the message and may trigger engagement based on the state machine.
 * This is fire-and-forget — errors are logged but don't propagate.
 */
export async function onGroupMessage(message: IncomingMessage): Promise<void> {
  if (!ECHO_ACTIVE_MODE || !message.isGroup || !isAIEnabled()) return;

  const state = getOrCreateState(message.chatId);
  const now = Date.now();

  // Always track the message in the buffer (useful for context in all phases)
  const senderLabel = message.senderName || 'משתמש';
  state.messageBuffer.push(`${senderLabel}: ${message.body}`);
  if (state.messageBuffer.length > BUFFER_CONTEXT_SIZE) {
    state.messageBuffer = state.messageBuffer.slice(-BUFFER_CONTEXT_SIZE);
  }
  state.lastMessageAt = now;

  // Phase-based handling
  switch (state.phase) {
    case 'LURKING':
      await handleLurking(message.chatId, state);
      break;

    case 'ENGAGED':
      await handleEngaged(message.chatId, state, now);
      break;

    case 'COOLDOWN':
      handleCooldown(state, now);
      break;
  }
}

// =====================
// Phase Handlers
// =====================

/**
 * LURKING: accumulate messages, every LURK_BUFFER_SIZE messages ask Groq if the topic is interesting.
 */
async function handleLurking(groupId: string, state: GroupEngagementState): Promise<void> {
  // Only evaluate every LURK_BUFFER_SIZE messages
  if (state.messageBuffer.length < LURK_BUFFER_SIZE) return;

  // Don't stack concurrent gating calls
  if (state.responding) return;
  state.responding = true;

  log.info(
    { groupId, bufferSize: state.messageBuffer.length },
    'Lurking — asking Groq if topic is interesting'
  );

  try {
    const gateResult = await shouldEchoEngage(state.messageBuffer);

    if (!gateResult.shouldEngage) {
      log.info({ groupId }, 'Groq says SKIP — clearing buffer, keep lurking');
      state.messageBuffer = [];
      return;
    }

    log.info(
      { groupId, angle: gateResult.angle },
      'Groq says ENGAGE — generating initial response'
    );

    const angle = gateResult.angle || 'reaction';
    await generateAndSendActiveResponse(groupId, angle, false);

    // Transition → ENGAGED
    state.phase = 'ENGAGED';
    state.engagedSince = Date.now();
    state.followUpCount = 0;
    state.currentAngle = angle;
    state.messageBuffer = [];

    log.info({ groupId, angle }, 'Transitioned to ENGAGED');
  } catch (err) {
    log.error({ err, groupId }, 'Lurking evaluation failed');
  } finally {
    state.responding = false;
  }
}

/**
 * ENGAGED: Echo is in the conversation. May follow up on new messages.
 * Transitions to COOLDOWN when window expires, max follow-ups reached, or conversation dies.
 */
async function handleEngaged(
  groupId: string,
  state: GroupEngagementState,
  now: number
): Promise<void> {
  // Check if engagement should end
  const windowExpired = (now - state.engagedSince) > ENGAGEMENT_WINDOW_MS;
  const maxFollowUpsReached = state.followUpCount >= MAX_FOLLOW_UPS;

  if (windowExpired || maxFollowUpsReached) {
    transitionToCooldown(groupId, state, windowExpired ? 'window expired' : 'max follow-ups');
    return;
  }

  // Don't stack concurrent responses
  if (state.responding) return;

  // Roll the dice for a follow-up (40% chance)
  const roll = Math.random();
  if (roll > FOLLOW_UP_CHANCE) {
    log.debug({ groupId, roll }, 'Engaged — skipped follow-up (dice roll)');
    return;
  }

  state.responding = true;

  try {
    log.info(
      { groupId, followUpCount: state.followUpCount + 1, maxFollowUps: MAX_FOLLOW_UPS },
      'Engaged — generating follow-up response'
    );

    await generateAndSendActiveResponse(groupId, state.currentAngle, true);
    state.followUpCount++;

    // Check again after sending — if we just hit max, transition
    if (state.followUpCount >= MAX_FOLLOW_UPS) {
      transitionToCooldown(groupId, state, 'max follow-ups after send');
    }
  } catch (err) {
    log.error({ err, groupId }, 'Engaged follow-up failed');
  } finally {
    state.responding = false;
  }
}

/**
 * COOLDOWN: check if enough time has passed to return to lurking.
 * Messages are silently accumulated for context.
 */
function handleCooldown(state: GroupEngagementState, now: number): void {
  if ((now - state.cooldownSince) >= COOLDOWN_MS) {
    state.phase = 'LURKING';
    state.messageBuffer = [];
    log.debug('Cooldown expired — back to LURKING');
  }
}

/**
 * Transition from ENGAGED to COOLDOWN.
 */
function transitionToCooldown(
  groupId: string,
  state: GroupEngagementState,
  reason: string
): void {
  state.phase = 'COOLDOWN';
  state.cooldownSince = Date.now();
  state.followUpCount = 0;
  state.currentAngle = '';
  state.messageBuffer = [];

  log.info({ groupId, reason }, 'Transitioned to COOLDOWN');
}

// =====================
// Conversation Death Check (called on a timer or lazily)
// =====================

/**
 * Check all engaged groups for conversation death (no messages for CONVERSATION_DIED_MS).
 * Called periodically or can be checked lazily.
 */
export function checkConversationDeath(): void {
  const now = Date.now();
  for (const [groupId, state] of groupStates.entries()) {
    if (
      state.phase === 'ENGAGED' &&
      state.lastMessageAt > 0 &&
      (now - state.lastMessageAt) > CONVERSATION_DIED_MS
    ) {
      transitionToCooldown(groupId, state, 'conversation died (no messages)');
    }
  }
}

// Start a periodic check for conversation death (every 30 seconds)
setInterval(checkConversationDeath, 30 * 1000);

// =====================
// Response Generation
// =====================

/**
 * Generate a full AI response and send it to the group.
 *
 * @param groupId - WhatsApp group JID
 * @param angle - The engagement angle (joke, opinion, fact, reaction)
 * @param isFollowUp - Whether this is a follow-up (changes the prompt tone)
 */
async function generateAndSendActiveResponse(
  groupId: string,
  angle: string,
  isFollowUp: boolean
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

  let prompt: string;

  if (isFollowUp) {
    // Follow-up: Echo is already in the conversation, respond naturally
    prompt = lang === 'he'
      ? 'אתה כבר בתוך השיחה הזו. תגיב בצורה טבעית להודעה האחרונה — כמו חבר שכבר נמצא בשיחה ופשוט ממשיך. קצר ולעניין.'
      : 'You\'re already part of this conversation. Respond naturally to the latest message — like a friend who\'s already chatting. Keep it short.';
  } else {
    // Initial jump-in: use angle-specific prompts
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
    prompt = `${angleInstruction}\nאתה קופץ לשיחה בעצמך — אף אחד לא שאל אותך. תהיה טבעי ולא תגיד "ראיתי שדיברתם על..." — פשוט תכנס ישר.`;
  }

  // Show typing indicator while AI generates the response
  sendTypingIndicator(groupId);

  const response = await askAI(prompt, history);
  const { text } = extractReactionEmoji(response);
  const fullResponse = `🤖 ${text}`;

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

  log.info({ groupId, angle, isFollowUp }, 'Active response sent successfully');
}
