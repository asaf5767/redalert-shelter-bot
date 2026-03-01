/**
 * AI Service - Google Gemini integration
 *
 * Provides a simple Q&A capability via the !ask command.
 * Uses Gemini 2.5 Flash (free tier: 15 req/min, 1M tokens/day).
 *
 * Set GEMINI_API_KEY in your .env file to enable.
 * Get a free key at: https://aistudio.google.com/app/apikey
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config';
import { createLogger } from '../utils/logger';

const log = createLogger('ai');

const SYSTEM_PROMPT = `אתה עוזר ידידותי של בוט התרעות בשם "Red Alert Bot".
הבוט שולח התרעות בזמן אמת לקבוצות וואטסאפ כשיש אזעקות של פיקוד העורף בישראל.
ענה בצורה קצרה, קלילה וידידותית - כמו חבר, לא כמו פקיד.
אם שואלים בעברית - ענה בעברית. אם באנגלית - ענה באנגלית.
מקסימום 5-6 משפטים בתשובה. אין צורך בכותרות או רשימות ארוכות.`;

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
 * Send a question to Gemini and return the response text.
 * Throws on API errors.
 */
export async function askAI(question: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  log.info({ question }, 'Sending question to Gemini');
  const result = await model.generateContent(question);
  const text = result.response.text().trim();
  log.info({ chars: text.length }, 'Got Gemini response');
  return text;
}
