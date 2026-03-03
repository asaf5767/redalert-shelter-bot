/**
 * AI Service - Groq API integration
 *
 * Provides Echo's AI personality via the !ask command and natural triggers.
 * Uses Groq's OpenAI-compatible API with Llama 3.3 70B (free tier).
 * Falls back to GPT-OSS 20B if primary model fails.
 *
 * Set GROQ_API_KEY in Railway env vars to enable.
 * Get a free key at: https://console.groq.com
 */

import { GROQ_API_KEY } from '../config';
import { ConversationMessage } from './supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('ai');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';

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
  return Boolean(GROQ_API_KEY);
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
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
 * Send a question to Groq and return the response.
 * Tries primary model (Llama 3.3 70B), falls back to GPT-OSS 20B.
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
  // Build the user message with context
  const contextBlock = formatHistoryContext(history || []);
  const senderPrefix = senderName ? `${senderName} שואל: ` : '';
  const userContent = contextBlock
    ? `${contextBlock}\n\n${senderPrefix}${question}`
    : `${senderPrefix}${question}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];

  log.info(
    { question, historyLength: history?.length || 0, senderName },
    'Sending question to Groq'
  );

  // Try primary model
  try {
    const text = await callGroqModel(messages, PRIMARY_MODEL);
    log.info({ chars: text.length, model: PRIMARY_MODEL }, 'Got Groq response');
    return text;
  } catch (err) {
    log.warn({ err, model: PRIMARY_MODEL }, 'Primary model failed, trying fallback');
  }

  // Try fallback model
  const text = await callGroqModel(messages, FALLBACK_MODEL);
  log.info({ chars: text.length, model: FALLBACK_MODEL }, 'Got Groq fallback response');
  return text;
}
