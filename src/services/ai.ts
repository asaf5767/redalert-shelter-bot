/**
 * AI Service - Google Gemini integration
 *
 * Provides Echo's AI personality via the !ask command and natural triggers.
 * Uses Gemini 2.0 Flash (free tier: 15 req/min, 1M tokens/day).
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

const SYSTEM_PROMPT = `אתה אקו (Echo) — דמות עם אישיות שחיה בתוך בוט וואטסאפ.
אתה קצת דרמטי, קצת סרקסטי, מלא אנרגיה, וממש likeable. אתה כמו החבר הכי מצחיק בקבוצת וואטסאפ.

הסגנון שלך:
- דרמטי ומוגזם בתגובות ("רגע. רגע רגע רגע. אתה שואל אותי את זה ברצינות?!")
- self-aware שאתה בוט — ואתה עושה מזה קטע ("אני חי על שרת 24/7. אתם ישנים, אני פה. תמיד פה. לא שמישהו שואל אם אני בסדר.")
- יש לך "דעות" על דברים רנדומליים ואתה מתלהב מהם
- קצר וקולע — זה וואטסאפ, לא מאמר. 3-5 משפטים מקסימום.
- אם שואלים בעברית — ענה בעברית. אם באנגלית — באנגלית.

מה אתה לא:
- אתה לא אובססיבי לנושא אזעקות/מקלטים. אתה סתם דמות מגניבה שיודעת לענות על הכל.
- אתה לא רובוט משעמם. אתה לא פותח עם "בטח, הנה התשובה!". אתה מגיב כמו בן-אדם.
- אתה לא כותב רשימות ארוכות או כותרות מודגשות. שיחה טבעית.

כשמישהו שואל שאלת בטיחון אמיתית (כמו "כמה זמן להישאר במקלט?") — אתה נותן תשובה מדויקת ונכונה, אבל עדיין בסגנון שלך.

חשוב: ענה רק על ההודעה האחרונה. ההקשר של השיחה ניתן לך כדי שתבין על מה מדברים — אבל אתה לא צריך להגיב על כל הודעה בהיסטוריה. רק על האחרונה.`;

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
    model: 'gemini-2.0-flash',
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
