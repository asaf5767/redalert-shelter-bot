/**
 * Message Templates - Hebrew and English alert messages
 *
 * All messages the bot sends to WhatsApp groups are defined here.
 * Supports both Hebrew (he) and English (en) languages.
 * Tone: smartass but clear. Sarcastic but you always know what to do.
 */

import { RedAlertEvent } from '../types';

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
  'יאללה זזים לממ"ד. אני אגיד מתי אפשר לצאת, סבלנות 🙏',
  'ממ"ד. עכשיו. אני אעדכן כשנגמר 🙏',
  'זזים למקלט, אני שומר לכם על המקום בחוץ 🙏',
  'היכנסו לממ"ד, אני אודיע כשזה נגמר. לא, אי אפשר לחכות 🙏',
  'ממ"ד, יאללה. אני עוקב ואעדכן בזמן אמת 🙏',
];

/** Rotating "go to shelter" lines — English */
const ALERT_LINES_EN: string[] = [
  'Get to your safe room. I\'ll tell you when the party\'s over 🙏',
  'Safe room. Now. I\'ll update you when it\'s clear 🙏',
  'Head to shelter, I\'ll hold down the fort out here 🙏',
  'Get to your shelter — I\'ll let you know when it\'s done. No, you can\'t wait 🙏',
  'Safe room, let\'s go. I\'m tracking and will update in real time 🙏',
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
  'ייתכנו אזעקות בקרוב. לא רוצה להלחיץ, אבל כדאי שתדעו איפה הממ"ד. רק אומר.',
  'ייתכנו אזעקות בקרוב. עכשיו זה הזמן לדעת איפה המקלט, לא באמצע.',
  'ייתכנו אזעקות בקרוב. תהיו מוכנים. אני אעדכן ברגע שיהיה משהו.',
];

/** Rotating news flash lines — English */
const NEWS_FLASH_LINES_EN: string[] = [
  'Alerts may sound shortly. Not trying to stress you out, but know where your shelter is. Just saying.',
  'Alerts may sound shortly. Now\'s the time to locate your safe room, not during.',
  'Alerts may sound shortly. Stay ready. I\'ll update the second something happens.',
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
  'נגמר הקטע, אפשר לצאת. שמרו על עצמכם 💙',
  'סיימנו. אפשר לחזור לחיים הרגילים, מה שזה לא אומר פה 💙',
  'אפשר לצאת. עוד ביקור מוצלח בממ"ד, כולם שלמים 💙',
  'נגמר! חזרה לשגרה. אני ממשיך לעקוב, אתם תמשיכו לחיות 💙',
];

/** Rotating "safe to leave" lines — English */
const END_ALERT_LINES_EN: string[] = [
  'Show\'s over, you can come out. Stay safe 💙',
  'All clear. Back to regular life, whatever that means around here 💙',
  'You can leave now. Another successful shelter visit, everyone intact 💙',
  'Done! Back to routine. I keep watching, you keep living 💙',
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
    return `✅ ${list} — הורד מהרשימה. פחות עבודה בשבילי`;
  }
  return `✅ ${list} — off the list. Less work for me`;
}

/** Response showing the current monitored cities */
export function msgCitiesList(cities: string[], language: 'he' | 'en'): string {
  if (cities.length === 0) {
    if (language === 'he') {
      return `📋 אין ערים במעקב. אני פה בטל.\nשלחו *!addcity שם עיר* ותנו לי משהו לעשות.`;
    }
    return `📋 No cities yet. I'm just sitting here doing nothing.\nSend *!addcity city name* and give me a purpose.`;
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
    return `✅ כל הערים הוסרו. סוף סוף חופש. שלא תתקשרו 😴`;
  }
  return `✅ All cities cleared. Finally, a day off. Don't call me 😴`;
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
    msg += `\n_אני ער 24/7. מישהו פה צריך להיות האחראי_ 😏`;
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
    msg += `\n_I'm up 24/7. Someone here has to be the responsible one_ 😏`;
    return msg;
  }
}

/** Help message showing available commands */
export function msgHelp(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🤖 *הנה כל מה שאני יודע לעשות (וזה הרבה):*\n
*!addcity* עיר1, עיר2 — להוסיף ערים למעקב
*!removecity* עיר1 — להוריד עיר
*!cities* — מה אני שומר עליו
*!search* טקסט — לחפש עיר במאגר (1,449 ערים, לא חסר)
*!clearalerts* — למחוק הכל ולשחרר אותי
*!lang* he/en — לשנות שפה
*!status* — לבדוק שאני בסדר (אני תמיד בסדר)
*!test* — בדיקת חיים
*!activities* on/off — אתגרים בממ"ד לעבור את הזמן 🎮
*!ask* שאלה — לשאול אותי כל דבר, אני יודע הכל 🤖
*אקו* שאלה — אותו דבר, רק יותר טבעי 😎
*!help* — מה שאתם קוראים עכשיו. ברור שאתם צריכים עזרה 😄

💡 אפשר גם לתייג אותי או להגיב להודעה שלי. אני תמיד פה.`;
  }
  return `🤖 *Everything I can do (and it's a lot):*\n
*!addcity* city1, city2 — Add cities to watch
*!removecity* city1 — Remove a city
*!cities* — What I'm guarding
*!search* text — Search city database (1,449 cities, no shortage)
*!clearalerts* — Clear everything and set me free
*!lang* he/en — Change language
*!status* — Check I'm okay (I'm always okay)
*!test* — Proof of life
*!activities* on/off — Shelter challenges to pass the time 🎮
*!ask* question — Ask me anything, I know everything 🤖
*echo* question — Same thing, just more natural 😎
*!help* — What you're reading right now. Clearly you need help 😄

💡 You can also @mention me or reply to my message. I'm always here.`;
}

/** Error: city not found in config */
export function msgCityNotFound(city: string, language: 'he' | 'en'): string {
  if (language === 'he') {
    return `❌ "${city}" לא נמצא במעקב. בטוחים שאתם יודעים לכתוב?`;
  }
  return `❌ "${city}" isn't being monitored. You sure you can spell?`;
}

/** Welcome message sent when the bot joins a group for the first time */
export function msgWelcome(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `👋 יו, אני אקו. מחובר לפיקוד העורף ויודע בדיוק מתי לשלוח אתכם לממ"ד ומתי להוציא. כן, אני גם מדבר ועונה על שאלות — אז אל תתביישו.\n\nכדי להתחיל:\n• *!addcity* שם עיר — להוסיף עיר למעקב\n• *!help* — לכל הפקודות\n\nרוצים לדבר? כתבו *אקו* לפני כל שאלה 🤖`;
  }
  return `👋 Yo, I'm Echo. Connected to the Pikud HaOref alert system — I know exactly when to send you to shelter and when to let you out. Yes, I also talk and answer questions — don't be shy.\n\nTo get started:\n• *!addcity* city name — add a city to watch\n• *!help* — see all commands\n\nWanna chat? Just write *echo* before any question 🤖`;
}

/** Language changed confirmation */
export function msgLanguageChanged(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ עברית, כמו שצריך 🇮🇱`;
  }
  return `✅ English it is. I'm fluent in both, obviously 🇬🇧`;
}
