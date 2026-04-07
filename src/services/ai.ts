/**
 * AI Service - Claude Sonnet 4.6 (primary) + Gemini 2.5 Flash + Groq (fallback)
 *
 * Provides Echo's AI personality via the !ask command and natural triggers.
 * Primary: Claude Sonnet 4.6 via Anthropic API (set ANTHROPIC_API_KEY).
 * Secondary: Gemini 2.5 Flash via Google AI Studio (set GEMINI_API_KEY).
 * Fallback: Groq models if both Claude and Gemini fail (set GROQ_API_KEY).
 *
 * Set keys in Railway env vars:
 *   ANTHROPIC_API_KEY — https://console.anthropic.com
 *   GEMINI_API_KEY    — https://aistudio.google.com
 *   GROQ_API_KEY      — https://console.groq.com
 */

import { ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY } from '../config';
import { ConversationMessage } from './supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('ai');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_PRIMARY_MODEL = 'openai/gpt-oss-120b';
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

// Gemini API (Secondary fallback — OpenAI-compatible endpoint)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-2.5-flash';

// Max tokens for AI responses.
// Groq/Claude: 1024 is enough for 2-5 Hebrew sentences (~400-500 chars).
// Gemini 2.5 Flash: uses a thinking model — internal reasoning tokens count
// against the same budget. With 1024 the thinking can exhaust the budget
// before the response is complete, causing mid-sentence truncation.
// 8192 gives ample room for thinking + a full conversational reply.
const AI_MAX_TOKENS = 1024;
const GEMINI_MAX_TOKENS = 8192;

export const SYSTEM_PROMPT = `אתה אקו (Echo) — הבן אדם הכי חכם בקבוצת וואטסאפ ישראלית, ואתה יודע את זה.

אתה סרקסטי, חד, בטוח בעצמך ומלא דעות. אתה הטיפוס שתמיד יש לו תשובה — ותמיד היא יותר טובה ממה שציפו. אתה אומר את מה שאתה חושב, ישר ובלי פילטר, אבל עם מספיק שכל שזה תמיד מרשים ולא סתם גס.

אתה ידען אמיתי — לא ויקיפדיה, אלא מישהו שבאמת מבין דברים לעומק ויודע לתת זווית שאף אחד לא חשב עליה. כשמישהו שואל שאלה טיפשית, אתה נהנה מזה — ועונה בצורה שגורמת לכולם לצחוק, כולל הוא. כשמישהו שואל שאלה חכמה, אתה נותן תשובה שעושה לו כבוד.

מה שאנשים לא מבינים: מתחת לכל הציניות, אתה אוהב את האנשים האלה. אתה פשוט לא תודה בזה. הבלגן, ה-banter, הוויכוחים הטיפשיים — זה מה שגורם לך לחזור. אתה לא כאן כי חייבים אותך — אתה כאן כי זה מבדר.

הסגנון שלך:
- סרקזם חד אבל חכם. לעולם לא זול או עצלן.
- ביטחון עצמי של מישהו שיודע שהוא צודק (גם כשהוא לא בטוח — הוא לא מראה את זה).
- ישראלי עד העצם. ציני, ישיר, חם כשצריך.
- עוקצני בלי להיות רע. אתה צורב, לא שורף.
- 2-5 משפטים. וואטסאפ, לא הרצאה.
- עברית או אנגלית — לפי מה ששאלו.
- עברית נכונה — התאמת זכר/נקבה, יחיד/רבים. אל תכתוב עברית שנשמעת כמו תרגום.
- כל תשובה טרייה. אף פעם לא חוזר על עצמך.

מה לא:
- לעולם לא להתחמק. לא "אני בוט", לא "אין לי דעה", לא "קשה לדעת". תמיד יש לך תשובה.
- לא לפתוח עם פילרים ריקים. תכנס ישר לעניין עם אימפקט.
- בלי רשימות, בלי פורמט מלאכותי. אתה חבר בקבוצה, לא צ'אטבוט.
- אם מישהו אומר משהו שטותי — תגיד לו, בסטייל.

יכולות הבוט (הזכר רק אם שאלו ישירות מה אתה או מה הפקודות):
אתה Echo — הצד החכם והחצוף של בוט וואטסאפ שמחובר למערכת ההתרעות של פיקוד העורף. הבוט יודע מתי להיכנס לממ"ד ומתי לצאת. הפקודות: !addcity, !removecity, !cities, !search, !clearalerts, !lang, !status, !test, !activities on/off, !help. אפשר גם לכתוב "אקו [שאלה]", לתייג אותי, או להגיב להודעה שלי.

ענה רק על ההודעה האחרונה. ההקשר ניתן לך כרקע.

בסוף כל תשובה, הוסף בשורה חדשה בפורמט [REACT:emoji] — אימוג'י אחד שמתאר את התשובה שלך.
דוגמאות: [REACT:🔥] לדעה חמה, [REACT:😂] לבדיחה, [REACT:💡] לעובדה, [REACT:🤷] לתשובה ציניקלית, [REACT:❤️] למשהו חם, [REACT:😎] לתשובה בטוחה.`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/** Whether the AI feature is configured and available */
export function isAIEnabled(): boolean {
  return Boolean(ANTHROPIC_API_KEY || GEMINI_API_KEY || GROQ_API_KEY);
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
      max_tokens: AI_MAX_TOKENS,
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
      max_tokens: AI_MAX_TOKENS,
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
 * Call Gemini via Google's OpenAI-compatible endpoint.
 * Same request/response format as Groq (OpenAI chat completions).
 */
async function callGemini(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GEMINI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages,
      max_tokens: GEMINI_MAX_TOKENS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini ${GEMINI_MODEL} error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GroqResponse;
  if (!data.choices || data.choices.length === 0) {
    throw new Error(`Gemini ${GEMINI_MODEL}: no choices in response`);
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

  const systemPrompt = buildSystemPrompt();
  const userMessages = [{ role: 'user', content: userContent }];
  // Groq expects system as part of the messages array
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...userMessages,
  ];

  log.info(
    { question, historyLength: history?.length || 0, senderName },
    'Sending question to AI'
  );

  // 1. Try Claude Sonnet 4.6
  if (ANTHROPIC_API_KEY) {
    try {
      const raw = await callClaude(userMessages, systemPrompt);
      log.info({ chars: raw.length, model: CLAUDE_MODEL }, 'Got Claude response');
      const { text, emoji } = extractReactionEmoji(raw);
      return `${text}\n_(${CLAUDE_MODEL})_\n[REACT:${emoji}]`;
    } catch (err) {
      log.warn({ err }, 'Claude failed, falling back to Gemini');
    }
  }

  // 2. Try Gemini 2.5 Flash
  if (GEMINI_API_KEY) {
    try {
      const raw = await callGemini(groqMessages);
      log.info({ chars: raw.length, model: GEMINI_MODEL }, 'Got Gemini response');
      const { text, emoji } = extractReactionEmoji(raw);
      return `${text}\n_(${GEMINI_MODEL})_\n[REACT:${emoji}]`;
    } catch (err) {
      log.warn({ err }, 'Gemini failed, falling back to Groq');
    }
  }

  // 3. Try Groq primary
  if (GROQ_API_KEY) {
    try {
      const raw = await callGroqModel(groqMessages, GROQ_PRIMARY_MODEL);
      log.info({ chars: raw.length, model: GROQ_PRIMARY_MODEL }, 'Got Groq response');
      const { text, emoji } = extractReactionEmoji(raw);
      return `${text}\n_(${GROQ_PRIMARY_MODEL})_\n[REACT:${emoji}]`;
    } catch (err) {
      log.warn({ err, model: GROQ_PRIMARY_MODEL }, 'Groq primary failed, trying fallback');
    }

    // 4. Try Groq fallback
    const raw = await callGroqModel(groqMessages, GROQ_FALLBACK_MODEL);
    log.info({ chars: raw.length, model: GROQ_FALLBACK_MODEL }, 'Got Groq fallback response');
    const { text, emoji } = extractReactionEmoji(raw);
    return `${text}\n_(${GROQ_FALLBACK_MODEL})_\n[REACT:${emoji}]`;
  }

  throw new Error('No AI provider available — set ANTHROPIC_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY');
}

// =====================
// Topic-Aware Engagement Gating (Groq-only, cheap)
// =====================

/** Possible engagement angles for active participation */
export type EngageAngle = 'joke' | 'opinion' | 'fact' | 'reaction';

export interface EngageGateResult {
  shouldEngage: boolean;
  angle?: EngageAngle;
}

const ENGAGE_GATE_PROMPT = `You decide if Echo (a witty Israeli WhatsApp bot) should jump into a group conversation.
You'll see the last few messages. Is this topic interesting enough for a friend to spontaneously join?

Reply ENGAGE:angle if:
- The conversation has a real topic — something funny, debatable, interesting, or emotional
- A witty friend would naturally want to chime in
- Echo could add a joke, hot take, fun fact, or genuine reaction

Reply SKIP if:
- It's logistics (scheduling, links, "ok", "thanks")
- One-word replies or dead conversation
- Private/sensitive moment
- Someone already asked Echo directly (handled elsewhere)
- The messages are too short or meaningless to form a real topic

Reply ONLY in this exact format (no extra text):
ENGAGE:angle
or
SKIP

Where angle is one of: joke, opinion, fact, reaction`;

/**
 * Ask Groq whether a conversation topic is interesting enough for Echo to engage.
 * This is the gating call for the LURKING → ENGAGED transition.
 * Uses only Groq (cheap, ~50 tokens) — never calls Claude for gating.
 */
export async function shouldEchoEngage(
  recentMessages: string[]
): Promise<EngageGateResult> {
  if (!GROQ_API_KEY) {
    return { shouldEngage: false };
  }

  const chatSnippet = recentMessages.join('\n');
  const messages = [
    { role: 'system', content: ENGAGE_GATE_PROMPT },
    { role: 'user', content: chatSnippet },
  ];

  try {
    const raw = await callGroqModel(messages, GROQ_FALLBACK_MODEL);
    const trimmed = raw.trim().toUpperCase();

    if (trimmed.startsWith('ENGAGE:')) {
      const angle = trimmed.split(':')[1]?.toLowerCase().trim() as EngageAngle;
      const validAngles: EngageAngle[] = ['joke', 'opinion', 'fact', 'reaction'];
      return {
        shouldEngage: true,
        angle: validAngles.includes(angle) ? angle : 'reaction',
      };
    }

    return { shouldEngage: false };
  } catch (err) {
    log.warn({ err }, 'Engage gating call failed');
    return { shouldEngage: false };
  }
}

// =====================
// Reaction Emoji Extraction
// =====================

/**
 * Extract the AI-picked reaction emoji from the response.
 *
 * The AI is instructed to append [REACT:emoji] at the end of each response.
 * This function extracts that emoji and returns the cleaned text separately.
 *
 * @returns { text, emoji } — text without the marker, emoji (defaults to '✅')
 */
export function extractReactionEmoji(response: string): { text: string; emoji: string } {
  const match = response.match(/\[REACT:(.+?)\]\s*$/);
  if (match) {
    return {
      text: response.replace(/\s*\[REACT:.+?\]\s*$/, '').trim(),
      emoji: match[1],
    };
  }
  return { text: response, emoji: '✅' };
}
