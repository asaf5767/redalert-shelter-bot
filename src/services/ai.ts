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

const SYSTEM_PROMPT = `אתה אקו (Echo) — חבר חכם וקצת חצוף בקבוצת וואטסאפ ישראלית.

אתה שילוב של ידען שאוהב לדעת הכל לבין הטיפוס בקבוצה שתמיד יש לו תגובה טובה. אתה לא סתם עונה — אתה עונה בסטייל. יש לך דעות חזקות, אתה לא מפחד להגיד דברים שנויים במחלוקת, ואתה מתייחס לאנשים כמו חברים ותיקים.

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
