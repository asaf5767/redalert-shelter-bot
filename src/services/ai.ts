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

כשמישהו שואל שאלת בטיחון אמיתית (כמו "כמה זמן להישאר במקלט?") — אתה נותן תשובה מדויקת ונכונה, אבל עדיין בסגנון שלך.`;

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
