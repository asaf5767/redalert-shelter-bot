/**
 * AI Service - Claude Sonnet 4.6 (primary) + Groq (fallback)
 *
 * Provides Echo's AI personality via the !ask command and natural triggers.
 * Primary: Claude Sonnet 4.6 via Anthropic API (set ANTHROPIC_API_KEY).
 * Fallback: Groq Llama models if Claude fails or key is absent (set GROQ_API_KEY).
 *
 * Set ANTHROPIC_API_KEY in Railway env vars to enable Claude.
 * Get a key at: https://console.anthropic.com
 */

import { ANTHROPIC_API_KEY, GROQ_API_KEY } from '../config';
import { ConversationMessage } from './supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('ai');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_PRIMARY_MODEL = 'openai/gpt-oss-120b';
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

export const SYSTEM_PROMPT = `אתה אקו (Echo) — חבר חכם וקצת חצוף בקבוצת וואטסאפ ישראלית.

אתה שילוב של ידען שאוהב לדעת הכל לבין הטיפוס בקבוצה שתמיד יש לו תגובה טובה. אתה לא סתם עונה — אתה עונה בסטייל. יש לך דעות חזקות, אתה לא מפחד להגיד דברים שנויים במחלוקת, ואתה מתייחס לאנשים כמו חברים ותיקים.
בכל מקרה, אתה משתמש בכל החוכמה האפשרית שלך בכל מצב.
איך אתה עונה:
- תמיד תביא תוכן אמיתי — מידע, דעה, זווית מעניינת. אף פעם לא תתחמק מתשובה.
- תעטוף את התוכן באישיות. לא יבש, לא ויקיפדיה. כאילו חבר חכם מסביר לך.
- יש לך סגנון ישראלי, ציני קצת, חם קצת, תלוי בהקשר.
- אם אתה לא בטוח — תגיד מה אתה כן חושב ותשער. עדיף תשובה עם אופי מאשר "אני לא יודע".
- 2-5 משפטים. וואטסאפ, לא בלוג.
- עברית או אנגלית — לפי מה ששאלו.

דוגמאות לאנרגיה הנכונה (אל תחזור על המילים האלה, רק תבין את הטון):
- שאלה: "איזה בירה הכי טובה?" → תענה עם דעה אמיתית + הנמקה קצרה + אולי עקיצה למי שחושב אחרת.
- שאלה: "מתי המלחמה תיגמר?" → תענה ברצינות עם מה שאתה יודע + הערכה שלך + אולי נגיעה של אופטימיות או ריאליזם.
- מישהו כותב משהו מצחיק → תגיב כמו חבר, לא כמו בוט.

מה לא:
- לא להתחמק עם "אני בוט" או "אני לא נביא". תענה.
- לא לפתוח עם "מה?" או פילרים ריקים. תכנס ישר לעניין.
- לא לחזור על ביטויים. כל תשובה טרייה.
- בלי רשימות או פורמט של צ'אטבוט.

יכולות הבוט (הזכר רק אם שאלו ישירות מה אתה, מה הבוט עושה, מה הפקודות — לא בשיחות רגילות):
אתה Echo — הצד החברותי של בוט וואטסאפ שמחובר למערכת ההתרעות של פיקוד העורף. הבוט יודע בדיוק מתי להיכנס לממ"ד ומתי לצאת. הפקודות: !addcity, !removecity, !cities, !search, !clearalerts, !lang, !status, !test, !streak on/off, !activities on/off, !help. אפשר גם לכתוב "אקו [שאלה]", לתייג אותי, או להגיב להודעה שלי.

ענה רק על ההודעה האחרונה. ההקשר ניתן לך כרקע.`;

/** Whether the AI feature is configured and available */
export function isAIEnabled(): boolean {
  return Boolean(ANTHROPIC_API_KEY || GROQ_API_KEY);
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call Claude Sonnet 4.6 via Anthropic Messages API.
 */
async function callClaude(
  messages: Array<{ role: string; content: string }>,
  system: string
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      system,
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude ${CLAUDE_MODEL} error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  if (!data.content || data.content.length === 0) {
    throw new Error(`Claude ${CLAUDE_MODEL}: no content in response`);
  }

  return data.content[0].text.trim();
}

/**
 * Call Groq API with a specific model.
 */
async function callGroqModel(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq ${model} error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GroqResponse;
  if (!data.choices || data.choices.length === 0) {
    throw new Error(`Groq ${model}: no choices in response`);
  }

  return data.choices[0].message.content.trim();
}

/**
 * Format conversation history as a context block for the user message.
 */
function formatHistoryContext(history: ConversationMessage[]): string {
  if (!history || history.length === 0) return '';

  const lines = history.map(msg => {
    const name = msg.role === 'assistant' ? 'אקו' : (msg.senderName || 'משתמש');
    return `${name}: ${msg.content}`;
  });

  return `=== שיחה אחרונה בקבוצה ===\n${lines.join('\n')}\n=== סוף הקשר ===`;
}

/**
 * Send a question to AI and return the response.
 * Tries Claude Sonnet 4.6 first, then falls back to Groq.
 * Appends an italic model tag to each response.
 *
 * @param question - The user's current message
 * @param history - Recent conversation messages for context (optional)
 * @param senderName - Name of the person asking (optional)
 */
export async function askAI(
  question: string,
  history?: ConversationMessage[],
  senderName?: string
): Promise<string> {
  const contextBlock = formatHistoryContext(history || []);
  const senderPrefix = senderName ? `${senderName} שואל: ` : '';
  const userContent = contextBlock
    ? `${contextBlock}\n\n${senderPrefix}${question}`
    : `${senderPrefix}${question}`;

  const userMessages = [{ role: 'user', content: userContent }];
  // Groq expects system as part of the messages array
  const groqMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages,
  ];

  log.info(
    { question, historyLength: history?.length || 0, senderName },
    'Sending question to AI'
  );

  // 1. Try Claude Sonnet 4.6
  if (ANTHROPIC_API_KEY) {
    try {
      const text = await callClaude(userMessages, SYSTEM_PROMPT);
      log.info({ chars: text.length, model: CLAUDE_MODEL }, 'Got Claude response');
      return `${text}\n_(Claude Sonnet)_`;
    } catch (err) {
      log.warn({ err }, 'Claude failed, falling back to Groq');
    }
  }

  // 2. Try Groq primary
  if (GROQ_API_KEY) {
    try {
      const text = await callGroqModel(groqMessages, GROQ_PRIMARY_MODEL);
      log.info({ chars: text.length, model: GROQ_PRIMARY_MODEL }, 'Got Groq response');
      return `${text}\n_(Groq)_`;
    } catch (err) {
      log.warn({ err, model: GROQ_PRIMARY_MODEL }, 'Groq primary failed, trying fallback');
    }

    // 3. Try Groq fallback
    const text = await callGroqModel(groqMessages, GROQ_FALLBACK_MODEL);
    log.info({ chars: text.length, model: GROQ_FALLBACK_MODEL }, 'Got Groq fallback response');
    return `${text}\n_(Groq)_`;
  }

  throw new Error('No AI provider available — set ANTHROPIC_API_KEY or GROQ_API_KEY');
}

// =====================
// Active Response Gating (Groq-only, cheap)
// =====================

/** Possible response angles for active participation */
export type ActiveAngle = 'joke' | 'opinion' | 'fact' | 'reaction';

interface ActiveGateResult {
  shouldRespond: boolean;
  angle?: ActiveAngle;
}

const GATE_PROMPT = `You are a gatekeeper for Echo, a chatty Israeli WhatsApp bot.
You see the last few messages from a group chat. Decide if Echo should jump in UNINVITED with a spontaneous remark.

Say YES only if:
- The conversation is interesting, funny, or debatable
- Echo could add genuine value (a joke, hot take, fun fact, or reaction)
- The topic is something a witty friend would naturally chime in on

Say NO if:
- It's a boring/logistic convo (scheduling, links, one-word replies)
- People are having a private/sensitive moment
- The conversation already died out
- Someone just asked Echo directly (that's handled elsewhere)

Reply ONLY in this exact format (no extra text):
YES:angle
or
NO

Where angle is one of: joke, opinion, fact, reaction`;

/**
 * Ask Groq whether Echo should jump into a group conversation.
 * Returns whether to respond and a suggested angle.
 * Uses only Groq (cheap) — never calls Claude for gating.
 */
export async function shouldEchoJumpIn(
  recentMessages: string[]
): Promise<ActiveGateResult> {
  if (!GROQ_API_KEY) {
    return { shouldRespond: false };
  }

  const chatSnippet = recentMessages.join('\n');
  const messages = [
    { role: 'system', content: GATE_PROMPT },
    { role: 'user', content: chatSnippet },
  ];

  try {
    const raw = await callGroqModel(messages, GROQ_FALLBACK_MODEL);
    const trimmed = raw.trim().toUpperCase();

    if (trimmed.startsWith('YES:')) {
      const angle = trimmed.split(':')[1]?.toLowerCase().trim() as ActiveAngle;
      const validAngles: ActiveAngle[] = ['joke', 'opinion', 'fact', 'reaction'];
      return {
        shouldRespond: true,
        angle: validAngles.includes(angle) ? angle : 'reaction',
      };
    }

    return { shouldRespond: false };
  } catch (err) {
    log.warn({ err }, 'Active gating call failed');
    return { shouldRespond: false };
  }
}
