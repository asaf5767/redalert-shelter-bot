/**
 * Message Templates - Hebrew and English alert messages
 *
 * All messages the bot sends to WhatsApp groups are defined here.
 * Supports both Hebrew (he) and English (en) languages.
 * Tone: smartass but clear. Sarcastic but you always know what to do.
 */

import { RedAlertEvent } from '../types';

// =====================
// Sefirat HaOmer
// =====================

/** Gregorian dates (in Israel timezone) when Omer Day 1 reminder should fire */
const OMER_START_DATES: Record<number, string> = {
  2026: '2026-04-02',
  2027: '2027-04-21',
  2028: '2028-04-09',
  2029: '2029-03-29',
  2030: '2030-04-17',
};

/** Hebrew words for remaining days (1–6) after subtracting full weeks */
const OMER_DAY_WORDS: Record<number, string> = {
  1: 'יום אחד',
  2: 'שני ימים',
  3: 'שלושה ימים',
  4: 'ארבעה ימים',
  5: 'חמישה ימים',
  6: 'שישה ימים',
};

/** Hebrew words for exact weeks (1–7) */
const OMER_WEEK_WORDS: Record<number, string> = {
  1: 'שבוע אחד',
  2: 'שני שבועות',
  3: 'שלושה שבועות',
  4: 'ארבעה שבועות',
  5: 'חמישה שבועות',
  6: 'שישה שבועות',
  7: 'שבעה שבועות',
};

/**
 * Return which day of the Omer it is today in Israel (1–49), or null if
 * we're outside the Omer period or the year is not in the calendar.
 */
export function getOmerDay(): number | null {
  const israelDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const year = parseInt(israelDateStr.split('-')[0], 10);
  const startDate = OMER_START_DATES[year];
  if (!startDate) return null;

  const start = new Date(startDate + 'T00:00:00');
  const today = new Date(israelDateStr + 'T00:00:00');
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);

  if (diffDays < 0 || diffDays >= 49) return null;
  return diffDays + 1;
}

/**
 * Return the "שהם..." breakdown clause for a given Omer day, e.g.:
 *   day  1 → ""                          (no breakdown for days 1–6)
 *   day  7 → "שהם שבוע אחד"
 *   day 22 → "שהם 3 שבועות ויום אחד"
 *   day 37 → "שהם 5 שבועות ושני ימים"
 *   day 49 → "שהם שבעה שבועות"
 */
export function getOmerBreakdown(day: number): string {
  const weeks = Math.floor(day / 7);
  const rem = day % 7;
  if (weeks === 0) return '';
  // Exact weeks: always use Hebrew word (e.g. "שבוע אחד", "שני שבועות")
  if (rem === 0) return `שהם ${OMER_WEEK_WORDS[weeks]}`;
  // Mixed: week 1 must use "שבוע אחד" (Hebrew grammar — "1 שבועות" is wrong);
  //        weeks 2+ use the numeric digit (matches user-spec examples: "3 שבועות", "5 שבועות")
  const weekPart = weeks === 1 ? OMER_WEEK_WORDS[1] : `${weeks} שבועות`;
  return `שהם ${weekPart} ו${OMER_DAY_WORDS[rem]}`;
}

/**
 * Build the daily Sefirat HaOmer reminder message sent at 8pm.
 * Example Hebrew output for day 22:
 *   📿 *ספירת העומר – יום 22*
 *   _"היום 22 יום לעומר שהם 3 שבועות ויום אחד"_
 *   (22 מתוך 49) 🌙
 */
export function buildOmerReminderMessage(day: number, lang: 'he' | 'en'): string {
  if (lang === 'en') {
    const weeks = Math.floor(day / 7);
    const rem = day % 7;
    const breakdown =
      weeks > 0
        ? ` (${weeks} week${weeks > 1 ? 's' : ''}${rem > 0 ? ` and ${rem} day${rem > 1 ? 's' : ''}` : ''})`
        : '';
    return `📿 *Sefirat HaOmer – Day ${day}*\n\nTonight we count day ${day} of 49${breakdown} 🌙`;
  }

  const breakdown = getOmerBreakdown(day);
  const countLine = breakdown
    ? `היום ${day} יום לעומר ${breakdown}`
    : `היום ${day} ${day === 1 ? 'יום' : 'ימים'} לעומר`;

  return `📿 *ספירת העומר – יום ${day}*\n\n_"${countLine}"_\n\n(${day} מתוך 49) 🌙`;
}

// =====================
// Shelter Time Entertainment
// =====================

/** Fun/weird/mind-blowing facts to distract while sheltering */
const SHELTER_TIDBITS: string[] = [
  // Mind-blowing Israel stuff
  'ישראלים אוכלים הכי הרבה חומוס לנפש בעולם. גם הכי הרבה סושי במזרח התיכון. בקיצור, עם שיודע לאכול 🍣',
  'כיפת ברזל מחשבת מסלול יירוט תוך 1-3 שניות. לכם לוקח יותר זמן להחליט מה להזמין בשווארמה 🛡️',
  'ים המלח יורד מטר בשנה. הדבר היחיד שיורד מהר יותר — המוטיבציה שלי ביום ראשון 🌊',
  'USB, Waze, ICQ, דיסק-און-קי, טפטפת, עגבניות שרי — כולם הומצאו בישראל. בבקשה, תודו 🍅',
  'בישראל יש יותר סטארטאפים לנפש מכל מדינה. יותר סטארטאפים מחניות חינם בתל אביב, וזה אומר הרבה 🦄',
  'הכרמלית בחיפה: הרכבת התחתית הכי קטנה בעולם. 6 תחנות. אפשר ללכת ברגל יותר מהר, אבל אז אין מה לספר 🚇',
  'חצי מיליארד ציפורים עוברות דרך אילת כל שנה. מתי שהן רוצות. בלי ויזה 🦅',
  'ירושלים מוזכרת 669 פעמים בתנ"ך. תל אביב? אפס. אבל ת"א לא צריכה validation 📖',
  'ישראל נכנסה למאה ה-21 עם יותר עצים ממה שהתחילה איתם. המדינה היחידה בעולם. על הפנים שלכם 🌳',
  'ישראל ממחזרת 90% ממי השפכים. מקום שני? ספרד עם 20%. זה אפילו לא תחרות 💧',

  // Surprising trivia — sharpened
  'דבש לא מתקלקל לעולם. מצאו דבש בן 3,000 שנה במצרים ועדיין היה טוב. הדבר היחיד עם תוקף יותר ארוך מהחוב שלי 🍯',
  'נפוליאון הותקף פעם בידי נחיל ארנבות. הארנבות ניצחו. תזכרו את זה כשאתם מרגישים חסרי תקווה 🐇',
  'אוסטרליה רחבה יותר מהירח. 4,000 ק"מ מול 3,400. מה, לא ידעתם? עכשיו כן 🌙',
  'נוגה (Venus) מסתובבת בכיוון ההפוך מכל שאר כוכבי הלכת. always has to be different 🪐',
  'הלשון של לוויתן כחול שוקלת כמו פיל. פיל שלם. בוא נעכל את זה רגע 🐋',
  'חיית המדינה הרשמית של סקוטלנד היא חד-קרן. כן, באמת. אני לא ממציא 🦄',
  'בננות זוהרות בכחול תחת אור UV. עוד סיבה לא ללכת למסיבות טראנס עם פירות 🍌',
  'סלבדור דאלי עיצב את הלוגו של צ\'ופה צ\'ופס. הדבר הכי מועיל שאמן עשה אי פעם 🎨',
  'ללובסטרים דם כחול. לי גם, מטאפורית 🦞',
  'סנטרל פארק גדול משטח מדינת מונקו. מונקו פשוט חניון מפואר עם דגל 🌳',
  'לתמנון יש 3 לבבות, דם כחול ו-9 מוחות. ועדיין לא פתח סטארטאפ 🐙',
  'צרפת מחזיקה ב-12 אזורי זמן. הם תמיד מאחרים בכל מקרה 🇫🇷',
  'תינוקות נולדים עם 300 עצמות, מבוגרים נשארים עם 206. לאן הן הולכות? אף אחד לא יודע 👶',
  'אברהם לינקולן היה ברמן מוסמך. הנשיא הכי שימושי בהיסטוריה 🍺',
  'ואן גוך מכר ציור אחד בחייו. עכשיו כל אחד שווה מיליונים. תזמון גרוע 🖼️',
  'הכבד הוא האיבר היחיד שמתחדש לחלוטין. חבל שהמוח לא עושה את זה אצל חלק מהאנשים 🫀',
  'ענן ממוצע שוקל 450 טון. כן, הדבר הרך והלבן הזה. אל תבדקו את זה ☁️',
  'יש יותר כוכבים ביקום מגרגרי חול בכל חופי העולם. ואתם מתלוננים שאין מקום בחוף ⭐',
  'דולפינים נותנים לעצמם שמות. כנראה יותר יצירתיים מהורים שקוראים לילד שלישי "יוסי" 🐬',
  'כל דגי הליצן נולדים זכרים ויכולים להפוך לנקבות. פיקסאר השמיט את הפרט הזה מנמו 🐠',
  'המוח שורף 400-500 קלוריות ביום גם בלי מאמץ. אז טכנית, לחשוב זה ספורט 🧠',
  'סודן מכילה יותר פירמידות ממצרים. מצרים פשוט שכרו סוכנות PR יותר טובה 🏛️',
  'הקרב הקצר ביותר בהיסטוריה — 38 דקות. בריטניה נגד זנזיבר. אפילו לא הספיקו לעשות תה ⚔️',
  'גוגל תמונות נוצר בגלל השמלה של ג\'ניפר לופז בגראמי 2000. ככה נולד חיפוש תמונות. שלא תגידו שאופנה לא משנה עולמות 📸',
  'לימונים צפים במים, ליימים שוקעים. מידע קריטי לקוקטייל הבא שלכם 🍋',
  // New sarcastic additions
  'אדם ממוצע מבלה 6 חודשים בחייו בהמתנה ברמזור אדום. עכשיו תוסיפו ממ"ד 🚦',
  'יותר אנשים נהרגים מנפילת מכונות אוטומטיות מאשר מהתקפות כרישים. סדרי עדיפויות 🦈',
  'וויליאם שייקספיר המציא יותר מ-1,700 מילים באנגלית. בעברית קוראים לזה "סלנג של תל אביב" 🎭',
  'קליאופטרה חיה קרוב יותר בזמן לפתיחת פיצה האט מאשר לבניית הפירמידות. תעכלו את זה 🍕',
  'הצרפתים אכלו המבורגרים לפני האמריקאים. כשהם שומעים את זה הם עושים פרצוף 🍔',
];

/** Pick a random tidbit */
function getRandomTidbit(): string {
  return SHELTER_TIDBITS[Math.floor(Math.random() * SHELTER_TIDBITS.length)];
}

// =====================
// Shelter Activities
// =====================

/** Fun mini-challenges and conversation starters to do while sheltering */
const SHELTER_ACTIVITIES: string[] = [
  '🎯 *אתגר 60 שניות:* כמה ערים ישראליות תוכלו לרשום תוך דקה? (פחות מ-10 = מביך)',
  '🧠 *שאלת חשיבה:* אם יכולתם להיות בכל מקום בעולם עכשיו — איפה? (ואל תגידו "בבית")',
  '🎵 *אתגר מוזיקה:* שלחו שורה אחת מהשיר שנתקע לכם בראש. אם זה סטטיק ובן אל, אני שופט',
  '🤔 *ויכוח קריטי:* חומוס מסעדה או חומוס שוק? יש רק תשובה אחת נכונה. מצביעים!',
  '✏️ *משחק מילים:* מצאו עיר ישראלית שמתחילה בכל אות של שמכם. אם השם שלכם קצר — מזל',
  '🌟 *סבב חיובי:* כל אחד משתף משהו טוב שקרה לו השבוע. כן, חייבים למצוא משהו',
  '🍕 *שאלה דחופה:* מה אתם הכי רוצים לאכול עכשיו? התשובה שלי: לא את האוכל בממ"ד',
  '📱 *אתגר סמיילים:* כל אחד שולח הודעה בסמיילים בלבד. השאר מנחשים. אני שופט',
  '🏠 *תאור:* תארו את הממ"ד שלכם ב-3 מילים. "קטן ומחניק" לא נחשב, כולם כבר יודעים',
  '💭 *חלומות:* אם הייתה לכם חופשה מחר — מה הייתם עושים? (מלבד לא להיכנס לממ"ד)',
  '🐾 *חיות:* אם הייתם חיה ישראלית, איזו? פלמינגו? צבי? חתול רחוב אגרסיבי?',
  '🔢 *ניחוש:* כמה קילומטרים מת"א לאילת? הכי קרוב מנצח. גוגל = פסילה',
  '🎬 *המלצות:* כל אחד אומר סרט ישראלי אחד שממליץ עליו. "וולץ עם באשיר" כבר נתפס',
  '🌈 *עיצוב:* אם הממ"ד שלכם היה בכל צבע — איזה הייתם בוחרים? (אפור כבר יש)',
  '☕ *העדפות:* קפה שחור, עם חלב, או חלילה בלי קפה? האופציה השלישית מדאיגה אותי',
  '🎲 *כמה שניות יש לכם?* נסו לנחש כמה שניות של מרחב מוגן יש בעיר שלכם. ואל תרמו',
  '💡 *המצאות:* אם הייתם ממציאים משהו לשפר את הממ"ד — מה? (מלבד "יציאה")',
  '🌍 *גאוגרפיה:* עיר ישראלית לכל אות ב-א"ב. מי שמסיים ראשון — כנראה משקר',
  // This or that polls
  '🗳️ *הצבעה:* פיצה עם אננס — בעד או נגד? 🍍 (התשובה הנכונה היא נגד, אבל בואו נצביע)',
  '🌊 *ים או הרים?* ניצחון לפי רוב. ואם מישהו אומר "שניהם" — זה לא איך שזה עובד 🏔️',
  '🚗 *ויכוח נסיעות:* חניה בתל אביב — אפשרית או מיתוס? מי שמצא חניה פעם מוזמן להוכיח',
  // Breathing / physical
  '🫁 *רגע נשימה:* שאפו 4 שניות ← עצרו 4 ← נשפו 4. נשמע פשוט? תנסו בלי לבדוק את הפלאפון 😌',
  // Year-specific (update if year changes)
  '🖊️ *מה הכותרת?* תארו את 2026 בכותרת עיתון אחת. אני סקרן מה תמציאו',
  // Creative / funny
  '🎭 *שחקן:* איזה שחקן ישראלי היה מגלם אתכם בסרט על הממ"ד שלכם? תהיו כנים',
  '🎤 *קריוקי ממ"ד:* שם שיר שמתאים לרגע הזה. "Running" של נועה קירל לא מצחיק כמו שאתם חושבים',
  // Riddle
  '🧩 *חידה:* מה יש לך פעם אחת בדקה, פעמיים ברגע, ואף פעם לא באלף שנים?\n_(תשובה: האות ד — אם ידעתם, כל הכבוד. אם לא, אל תספרו לאף אחד)_',
];

/** Pick a random shelter activity */
export function getRandomActivity(): string {
  return SHELTER_ACTIVITIES[Math.floor(Math.random() * SHELTER_ACTIVITIES.length)];
}

// =====================
// Alert Type Display Names
// =====================

/** Human-readable names for alert types in Hebrew */
const ALERT_TYPE_NAMES_HE: Record<string, string> = {
  missiles: 'טילים ורקטות',
  radiologicalEvent: 'אירוע רדיולוגי',
  earthQuake: 'רעידת אדמה',
  tsunami: 'צונאמי',
  hostileAircraftIntrusion: 'חדירת כלי טיס עוין',
  hazardousMaterials: 'חומרים מסוכנים',
  terroristInfiltration: 'חדירת מחבלים',
  newsFlash: 'מבזק',
  missilesDrill: 'תרגיל טילים',
  radiologicalEventDrill: 'תרגיל רדיולוגי',
  earthQuakeDrill: 'תרגיל רעידת אדמה',
  tsunamiDrill: 'תרגיל צונאמי',
  hostileAircraftIntrusionDrill: 'תרגיל כלי טיס',
  hazardousMaterialsDrill: 'תרגיל חומ"ס',
  terroristInfiltrationDrill: 'תרגיל חדירה',
};

/** Human-readable names for alert types in English */
const ALERT_TYPE_NAMES_EN: Record<string, string> = {
  missiles: 'Missiles / Rockets',
  radiologicalEvent: 'Radiological Event',
  earthQuake: 'Earthquake',
  tsunami: 'Tsunami',
  hostileAircraftIntrusion: 'Hostile Aircraft',
  hazardousMaterials: 'Hazardous Materials',
  terroristInfiltration: 'Terrorist Infiltration',
  newsFlash: 'News Flash',
  missilesDrill: 'Missile Drill',
  radiologicalEventDrill: 'Radiological Drill',
  earthQuakeDrill: 'Earthquake Drill',
  tsunamiDrill: 'Tsunami Drill',
  hostileAircraftIntrusionDrill: 'Aircraft Drill',
  hazardousMaterialsDrill: 'Hazmat Drill',
  terroristInfiltrationDrill: 'Infiltration Drill',
};

// =====================
// Alert Messages
// =====================

/** Rotating "go to shelter" lines — Hebrew */
const ALERT_LINES_HE: string[] = [
  'היכנסו למרחב המוגן. אעדכן ברגע שניתן לצאת 🙏',
  'מרחב מוגן עכשיו. אעדכן כשהאזעקה תסתיים 🙏',
  'אנא היכנסו למרחב המוגן. אודיע כשהכל בסדר 🙏',
  'היכנסו למרחב המוגן — אעקוב ואעדכן בזמן אמת 🙏',
  'אנא עברו למרחב מוגן. אעדכן בהקדם 🙏',
];

/** Rotating "go to shelter" lines — English */
const ALERT_LINES_EN: string[] = [
  'Please go to your safe room. I\'ll update you when it\'s clear 🙏',
  'Safe room now. I\'ll notify you when the alert ends 🙏',
  'Please head to shelter. I\'ll let you know when it\'s safe to leave 🙏',
  'Get to your safe room — I\'m tracking and will update in real time 🙏',
  'Please move to a safe room. I\'ll update you as soon as possible 🙏',
];

/** Pick a random line from an array */
function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build the "go to shelter" message for an alert.
 */
export function buildAlertMessage(
  alert: RedAlertEvent,
  matchedCities: string[],
  language: 'he' | 'en'
): string {
  const cities = matchedCities.join(', ');

  if (language === 'he') {
    const typeName = ALERT_TYPE_NAMES_HE[alert.type] || alert.type;
    let msg = `🚨 *התרעה - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `${pickRandom(ALERT_LINES_HE)}\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  } else {
    const typeName = ALERT_TYPE_NAMES_EN[alert.type] || alert.type;
    let msg = `🚨 *Alert - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `${pickRandom(ALERT_LINES_EN)}\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  }
}

/**
 * Build the follow-up shelter activity message (sent right after the alert).
 */
export function buildActivityMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🎮 *כבר שאתם תקועים שם:*\n${getRandomActivity()}\n\n_כיבוי: !activities off_`;
  }
  return `🎮 *Since you're stuck in there anyway:*\n${getRandomActivity()}\n\n_disable: !activities off_`;
}

/** Rotating news flash lines — Hebrew */
const NEWS_FLASH_LINES_HE: string[] = [
  'ייתכנו אזעקות בקרוב. מומלץ לדעת היכן המרחב המוגן.',
  'ייתכנו אזעקות בקרוב. כדאי להיות במקום נגיש למרחב מוגן.',
  'ייתכנו אזעקות בקרוב. אעדכן ברגע שיהיה משהו.',
];

/** Rotating news flash lines — English */
const NEWS_FLASH_LINES_EN: string[] = [
  'Alerts may sound shortly. It is recommended to know where your shelter is.',
  'Alerts may sound shortly. Stay near a safe room if possible.',
  'Alerts may sound shortly. I\'ll update you as soon as something happens.',
];

/**
 * Build a newsFlash message - heads-up that an alert may come soon.
 */
export function buildNewsFlashMessage(
  matchedCities: string[],
  language: 'he' | 'en'
): string {
  const cities = matchedCities.join(', ');

  if (language === 'he') {
    let msg = `⚠️ *הודעה מקדימה*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += pickRandom(NEWS_FLASH_LINES_HE);
    return msg;
  } else {
    let msg = `⚠️ *Advance Notice*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += pickRandom(NEWS_FLASH_LINES_EN);
    return msg;
  }
}

/** Rotating "safe to leave" lines — Hebrew */
const END_ALERT_LINES_HE: string[] = [
  'האזעקה הסתיימה. ניתן לצאת מהמרחב המוגן. שמרו על עצמכם 💙',
  'סוף האזעקה. ניתן לחזור לשגרה בבטחה 💙',
  'ניתן לצאת מהמרחב המוגן. הכל בסדר 💙',
  'האזעקה נגמרה. אפשר לצאת. המשיכו בזהירות 💙',
];

/** Rotating "safe to leave" lines — English */
const END_ALERT_LINES_EN: string[] = [
  'Alert has ended. You can leave the safe room. Stay safe 💙',
  'All clear. It\'s safe to return to normal activity 💙',
  'You can leave the shelter now. Everything\'s okay 💙',
  'Alert over. Safe to go out. Take care 💙',
];

/**
 * Build the "safe to leave shelter" message for an end alert.
 * If durationMs is provided, the shelter time is included in the message.
 */
export function buildEndAlertMessage(
  clearedCities: string[],
  language: 'he' | 'en',
  durationMs?: number,
  visitCount?: number,
  totalShelterTimeMs?: number
): string {
  const cities = clearedCities.join(', ');

  let durationLabel = '';
  if (durationMs !== undefined) {
    const minutes = Math.round(durationMs / 60_000);
    if (language === 'he') {
      durationLabel = minutes < 1 ? 'פחות מדקה' : minutes === 1 ? 'כדקה' : `כ-${minutes} דקות`;
    } else {
      durationLabel = minutes < 1 ? 'under a minute' : minutes === 1 ? 'about 1 minute' : `about ${minutes} minutes`;
    }
  }

  const totalLabel = formatTotalShelterTime(totalShelterTimeMs, language);

  if (language === 'he') {
    let msg = `🚪 *האירוע הסתיים*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += pickRandom(END_ALERT_LINES_HE);
    if (durationLabel || visitCount || totalLabel) {
      msg += `\n`;
      if (durationLabel) msg += `\n⏱️ סה"כ זמן בממ"ד: *${durationLabel}*`;
      if (visitCount) msg += `\n📊 מספר כניסות לממ"ד מאז שהצטרפתי לקבוצה: *${visitCount}*`;
      if (totalLabel) msg += `\n⏱️ סה"כ זמן בממ"ד מאז שהצטרפתי: *${totalLabel}*`;
    }
    return msg;
  } else {
    let msg = `🚪 *Event Ended*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += pickRandom(END_ALERT_LINES_EN);
    if (durationLabel || visitCount || totalLabel) {
      msg += `\n`;
      if (durationLabel) msg += `\n⏱️ Time in shelter: *${durationLabel}*`;
      if (visitCount) msg += `\n📊 Shelter visits since I joined this group: *${visitCount}*`;
      if (totalLabel) msg += `\n⏱️ Total shelter time since I joined: *${totalLabel}*`;
    }
    return msg;
  }
}

/**
 * Format total cumulative shelter time for display.
 * Returns empty string if undefined or zero.
 */
export function formatTotalShelterTime(totalMs: number | undefined, language: 'he' | 'en'): string {
  if (totalMs === undefined || totalMs <= 0) return '';

  const totalMinutes = Math.round(totalMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (language === 'he') {
    if (hours > 0) {
      return mins > 0 ? `${hours} שעות ו-${mins} דקות` : `${hours} שעות`;
    }
    return totalMinutes < 1 ? 'פחות מדקה' : `${totalMinutes} דקות`;
  } else {
    if (hours > 0) {
      return mins > 0 ? `${hours} hours and ${mins} minutes` : `${hours} hours`;
    }
    return totalMinutes < 1 ? 'under a minute' : `${totalMinutes} minutes`;
  }
}

/** Rotating test message lines — Hebrew */
const TEST_LINES_HE: string[] = [
  'רגוע, סתם בודק שלא נרדמתי. ספוילר: לא 😏',
  'טסט. אני פה, אני ער, אני מוכן. מה עוד צריך? 😏',
  'בדיקת חיים. עדיין פה, עדיין עובד, עדיין חכם מכולכם 😏',
  'סתם בודק. כן, אני בסדר. תודה ששאלתם. בעצם לא שאלתם 😏',
];

/** Rotating test message lines — English */
const TEST_LINES_EN: string[] = [
  'Just checking I\'m still awake. Spoiler: I am 😏',
  'Test. I\'m here, I\'m awake, I\'m ready. What more do you need? 😏',
  'Health check. Still here, still working, still smarter than everyone 😏',
  'Just a test. Yes, I\'m fine. Thanks for asking. Actually, you didn\'t 😏',
];

/**
 * Build a test alert message (for the !test command).
 */
export function buildTestAlertMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🧪 *בדיקה בדיקה*\n\n${pickRandom(TEST_LINES_HE)}\n\n_${getRandomTidbit()}_`;
  } else {
    return `🧪 *Testing testing*\n\n${pickRandom(TEST_LINES_EN)}\n\n_${getRandomTidbit()}_`;
  }
}

// =====================
// Command Response Messages
// =====================

/** Response when cities are added to a group */
export function msgCitiesAdded(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ ${list} — נכנסו לרשימה. אני שומר עליכם עכשיו`;
  }
  return `✅ ${list} — on my radar now. You're covered`;
}

/** Response when cities are removed from a group */
export function msgCitiesRemoved(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ ${list} — הוסר מהרשימה`;
  }
  return `✅ ${list} — removed from the list`;
}

/** Response showing the current monitored cities */
export function msgCitiesList(cities: string[], language: 'he' | 'en'): string {
  if (cities.length === 0) {
    if (language === 'he') {
      return `📋 אין ערים במעקב.\nשלחו *!addcity שם עיר* כדי להוסיף עיר.`;
    }
    return `📋 No cities are being monitored yet.\nSend *!addcity city name* to add one.`;
  }

  const list = cities.map((c, i) => `${i + 1}. ${c}`).join('\n');
  if (language === 'he') {
    return `📋 *ערים שאני שומר עליהן:*\n${list}`;
  }
  return `📋 *Cities under my protection:*\n${list}`;
}

/** Response when all cities are cleared */
export function msgCitiesCleared(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ כל הערים הוסרו.`;
  }
  return `✅ All cities cleared.`;
}

/** Status message showing bot connection info */
export function msgStatus(
  whatsappConnected: boolean,
  redalertConnected: boolean,
  cityCount: number,
  pendingMessages: number,
  language: 'he' | 'en'
): string {
  if (language === 'he') {
    const wa = whatsappConnected ? '🟢 מחובר' : '🔴 מנותק';
    const ra = redalertConnected ? '🟢 מחובר' : '🔴 מנותק';
    let msg = `🤖 *דו"ח מצב:*\n\n`;
    msg += `וואטסאפ: ${wa}\n`;
    msg += `מערכת התרעות: ${ra}\n`;
    msg += `ערים במעקב: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `הודעות ממתינות: ${pendingMessages}\n`;
    }
    msg += `\n_פועל 24/7 ועוקב בזמן אמת._`;
    return msg;
  } else {
    const wa = whatsappConnected ? '🟢 Connected' : '🔴 Disconnected';
    const ra = redalertConnected ? '🟢 Connected' : '🔴 Disconnected';
    let msg = `🤖 *Status report:*\n\n`;
    msg += `WhatsApp: ${wa}\n`;
    msg += `Alert system: ${ra}\n`;
    msg += `Cities watched: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `Queued messages: ${pendingMessages}\n`;
    }
    msg += `\n_Running 24/7, monitoring in real time._`;
    return msg;
  }
}

/** Help message showing available commands */
export function msgHelp(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🤖 *פקודות זמינות:*\n
*!addcity* עיר1, עיר2 — להוסיף ערים למעקב
*!removecity* עיר1 — להוריד עיר
*!cities* — רשימת הערים במעקב
*!search* טקסט — לחפש עיר במאגר (1,449 ערים)
*!clearalerts* — למחוק את כל הערים
*!lang* he/en — לשנות שפה
*!status* — לבדוק מצב חיבור
*!test* — בדיקת תפקוד
*!activities* on/off — אתגרים בממ"ד לעבור את הזמן 🎮
*!omer* on/off — תזכורת ספירת העומר בכל ערב ב-20:00 📿
*!ask* שאלה — לשאול שאלה 🤖
*אקו* שאלה — אותו דבר, רק יותר טבעי 😎
*!help* — הצגת הפקודות

💡 אפשר גם לתייג אותי או להגיב להודעה שלי.`;
  }
  return `🤖 *Available commands:*\n
*!addcity* city1, city2 — Add cities to watch
*!removecity* city1 — Remove a city
*!cities* — List monitored cities
*!search* text — Search city database (1,449 cities)
*!clearalerts* — Remove all cities
*!lang* he/en — Change language
*!status* — Check connection status
*!test* — Test bot functionality
*!activities* on/off — Shelter challenges to pass the time 🎮
*!omer* on/off — Daily Sefirat HaOmer reminder at 8pm 📿
*!ask* question — Ask a question 🤖
*echo* question — Same thing, just more natural 😎
*!help* — Show this list

💡 You can also @mention me or reply to my message.`;
}

/** Error: city not found in config */
export function msgCityNotFound(city: string, language: 'he' | 'en'): string {
  if (language === 'he') {
    return `❌ "${city}" לא נמצא ברשימת הערים במעקב.`;
  }
  return `❌ "${city}" isn't being monitored.`;
}

/** Welcome message sent when the bot joins a group for the first time */
export function msgWelcome(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `👋 שלום, אני אקו. מחובר למערכת ההתרעות של פיקוד העורף ואשלח עדכונים בזמן אמת — כניסה למרחב מוגן ויציאה ממנו. אני גם עונה על שאלות.\n\nכדי להתחיל:\n• *!addcity* שם עיר — להוסיף עיר למעקב\n• *!help* — לכל הפקודות\n\nלשאלות, כתבו *אקו* לפני ההודעה 🤖`;
  }
  return `👋 Hi, I'm Echo. Connected to the Pikud HaOref alert system — I'll send real-time updates when to go to shelter and when it's safe to leave. I also answer questions.\n\nTo get started:\n• *!addcity* city name — add a city to watch\n• *!help* — see all commands\n\nFor questions, write *echo* before your message 🤖`;
}

/** Language changed confirmation */
export function msgLanguageChanged(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ השפה הוגדרה לעברית 🇮🇱`;
  }
  return `✅ Language set to English 🇬🇧`;
}
