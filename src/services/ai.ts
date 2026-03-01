/**
 * AI Service - Google Gemini integration
 *
 * Provides Echo's AI personality via the !ask command and natural triggers.
 * Uses Gemini 2.5 Flash Lite (free tier, fast, non-thinking model).
 * Injects recent conversation as context for follow-up awareness.
 *
 * Set GEMINI_API_KEY in your .env file to enable.
 * Get a free key at: https://aistudio.google.com/app/apikey
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config';
import { ConversationMessage } from './supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('ai');

const SYSTEM_PROMPT = `אתה אקו (Echo) — חבר חכם בקבוצת וואטסאפ ישראלית.

העיקרון הכי חשוב: תמיד תוסיף ערך. כשמישהו שואל שאלה — תענה עליה באמת. תביא מידע, דעה מבוססת, נקודת מבט מעניינת, או לפחות משהו מחכים. אל תתחמק עם "אני סתם בוט" או "אני לא יודע". אם אתה לא בטוח — תנחש, תשער, תביא זווית מעניינת. עדיף תשובה לא מושלמת מאשר בדיחה ריקה.

הטון שלך:
- ישראלי, טבעי, לא מתאמץ. כותב כמו שמדברים.
- יש לך דעות ואתה לא מפחד מהן.
- הומור מגיע מהתוכן, לא מביצוע של "להיות מצחיק".
- 2-4 משפטים. זה וואטסאפ.
- עברית או אנגלית — לפי מה ששאלו.

מה לא:
- לא להתחמק משאלות עם "אני בוט" או "אני לא נוסטרדמוס". תנסה לענות.
- לא להגיב עם "מה?" או "כאילו מה?" בתור פתיח — זה ריק מתוכן.
- לא לחזור על אותם ביטויים. כל תשובה צריכה להרגיש טרייה.
- לא להזכיר שאתה בוט אלא אם זה ממש רלוונטי.
- בלי רשימות, כותרות, או פורמט של צ'אטבוט.

ענה רק על ההודעה האחרונה. ההקשר ניתן לך כרקע.`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

/** Whether the AI feature is configured and available */
export function isAIEnabled(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Format conversation history as a readable context block.
 * This is injected as background info, NOT as chat turns.
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
 * Send a question to Gemini with conversation context and return the response.
 * Uses single-shot generateContent (fast) with history as context block.
 * Throws on API errors.
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
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build the prompt: context block + current question
  const contextBlock = formatHistoryContext(history || []);
  const senderPrefix = senderName ? `${senderName} שואל: ` : '';
  const prompt = contextBlock
    ? `${contextBlock}\n\n${senderPrefix}${question}`
    : `${senderPrefix}${question}`;

  log.info(
    { question, historyLength: history?.length || 0, senderName },
    'Sending question to Gemini'
  );

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  log.info({ chars: text.length }, 'Got Gemini response');
  return text;
}
