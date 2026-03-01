/**
 * Message Templates - Hebrew and English alert messages
 *
 * All messages the bot sends to WhatsApp groups are defined here.
 * Supports both Hebrew (he) and English (en) languages.
 * Tone: chill, friendly, a bit cheeky - not military/formal.
 */

import { RedAlertEvent } from '../types';

// =====================
// Shelter Time Entertainment
// =====================

/** Fun/weird/mind-blowing facts to distract while sheltering */
const SHELTER_TIDBITS: string[] = [
  // Mind-blowing Israel stuff
  'ישראלים אוכלים הכי הרבה חומוס לנפש בעולם. הפתעה: גם הכי הרבה סושי במזרח התיכון 🍣',
  'כיפת ברזל מחשבת מסלול יירוט תוך 1-3 שניות. המחשב שלך לוקח יותר זמן לפתוח Chrome 🛡️',
  'ים המלח יורד מטר בשנה. ביום שהוא ייעלם, כבר נהיה על מאדים 🌊',
  'USB, Waze, ICQ, דיסק-און-קי, הטפטפת, עגבניות שרי - כולם הומצאו בישראל. ארוחת הבוקר הכי חדשנית בעולם 🍅',
  'בישראל יש יותר סטארטאפים לנפש מבכל מדינה אחרת. בפועל? יותר סטארטאפים מחניות חינם בתל אביב 🦄',
  'הכרמלית בחיפה היא הרכבת התחתית הכי קטנה בעולם. 6 תחנות. אפשר ללכת ברגל יותר מהר אבל פחות כיף 🚇',
  'חצי מיליארד ציפורים עוברות דרך אילת כל שנה. יותר תיירים מכנפיים מתיירים עם מזוודות 🦅',
  'ירושלים מוזכרת 669 פעמים בתנ"ך. תל אביב? אפס. הרגשות של תל אביב: נפגעו 📖',
  'ישראל שתלה כל כך הרבה עצים שזו המדינה היחידה שנכנסה למאה ה-21 עם יותר עצים ממה שהתחילה. ירוק עלינו 🌳',
  'ישראל ממחזרת 90% ממי השפכים. מקום שני? ספרד עם 20%. אנחנו פשוט אחרת 💧',

  // Random weird & wonderful
  'תמנונים הם בעלי 3 לבבות, דם כחול, ו-9 מוחות. בעצם, הם מוכשרים יותר מרובנו 🐙',
  'דבש לא מתקלקל לעולם. מצאו דבש בן 3,000 שנה במצרים ועדיין אפשר לאכול אותו. תאריך תפוגה? לא מכירים 🍯',
  'כלבים יודעים להריח אם אתה עצוב. חתולים? גם יודעים. פשוט לא אכפת להם 🐕',
  'נמלים לא ישנות לעולם. בגלל זה הן תמיד כאלה עצבניות 🐜',
  'קואלות ישנות 22 שעות ביום. מצד שני, הן לא צריכות להכין ארוחת בוקר לילדים 🐨',
  'הלב של שרימפס נמצא בראש. לפחות הם חושבים עם הלב, לא? 🦐',
  'פרפרים טועמים עם הרגליים. אוקיי, זה פשוט גרוס 🦋',
  'בננה היא טכנית סוג של פירה (berry). תות? לא. העולם הזה שקרי 🍌',
  'לג׳ירפה ולבן אדם יש אותו מספר חוליות צוואר: 7. אבל רק אחד מהם מרגיש מוזר עם צוואר קצר 🦒',
  'יותר אנשים נהרגים בשנה מנפילת מכונות ממכר אוטומטיות מאשר מכרישים. המכונות מנצחות 🦈',

  // Existential & wholesome
  'יש יותר כוכבים ביקום מגרגרי חול על כל חופי העולם. אתה קטן. בצורה טובה ⭐',
  'עצי אקליפטוס משחררים שמנים שגורמים לערפל כחול. לכן הרי הכחולים באוסטרליה כחולים באמת 🏔️',
  'הצבע הכתום קיבל את שמו מהפרי, לא להפך. לפני כן קראו לצבע "אדום-צהוב". עצלנים 🍊',
  'תינוקות נולדים בלי עצמות ברך. הן מתפתחות אחר כך. תינוקות הם בעצם חייזרים רכים 👶',
  'מדוזות חיות כבר 650 מיליון שנה בלי מוח, לב, או עצמות. ועדיין שורדות. מעוררות השראה 🪼',
];

/** Pick a random tidbit */
function getRandomTidbit(): string {
  return SHELTER_TIDBITS[Math.floor(Math.random() * SHELTER_TIDBITS.length)];
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

/**
 * Build the "go to shelter" message for an alert.
 */
export function buildAlertMessage(
  alert: RedAlertEvent,
  matchedCities: string[],
  language: 'he' | 'en',
  countdownSeconds?: number | null
): string {
  const cities = matchedCities.join(', ');

  if (language === 'he') {
    const typeName = ALERT_TYPE_NAMES_HE[alert.type] || alert.type;
    let msg = `📢 *יאללה, ${typeName}*\n\n`;
    msg += `📍 ${cities}\n`;
    if (countdownSeconds) {
      msg += `⏱ *${countdownSeconds} שניות* למרחב המוגן\n`;
    }
    msg += `\nזז למרחב ברוגע, בלי פאניקה 🙏\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  } else {
    const typeName = ALERT_TYPE_NAMES_EN[alert.type] || alert.type;
    let msg = `📢 *Heads up - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n`;
    if (countdownSeconds) {
      msg += `⏱ *${countdownSeconds}s* to shelter\n`;
    }
    msg += `\nMove to your safe room, no panic 🙏\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  }
}

/**
 * Build a newsFlash message - heads-up that an alert may come soon.
 */
export function buildNewsFlashMessage(
  matchedCities: string[],
  language: 'he' | 'en'
): string {
  const cities = matchedCities.join(', ');

  if (language === 'he') {
    let msg = `⚡ *הדס אפ*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `יכול להיות שתהיה התרעה בקרוב.\n`;
    msg += `כדאי להיות ליד מרחב מוגן, סתם ככה, בקול 😎`;
    return msg;
  } else {
    let msg = `⚡ *Heads Up*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `Alert might go off soon.\n`;
    msg += `Maybe hang near a shelter, just casually 😎`;
    return msg;
  }
}

/**
 * Build the "safe to leave shelter" message for an end alert.
 */
export function buildEndAlertMessage(
  clearedCities: string[],
  language: 'he' | 'en'
): string {
  const cities = clearedCities.join(', ');

  if (language === 'he') {
    let msg = `✅ *סיימנו! אפשר לצאת* 🎉\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `חזרה לשגרה. שמרו על עצמכם 💙`;
    return msg;
  } else {
    let msg = `✅ *All clear! You're free* 🎉\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `Back to normal. Stay safe out there 💙`;
    return msg;
  }
}

/**
 * Build a test alert message (for the !test command).
 */
export function buildTestAlertMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🧪 *בדיקה בדיקה*\n\nזה סתם טסט, הכל טוב 😄\nהבוט ער ומחובר למערכת.\n\n_${getRandomTidbit()}_`;
  } else {
    return `🧪 *Testing testing*\n\nJust a test, all good 😄\nBot is awake and connected.\n\n_${getRandomTidbit()}_`;
  }
}

// =====================
// Command Response Messages
// =====================

/** Response when cities are added to a group */
export function msgCitiesAdded(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ ערים נוספו למעקב: ${list}`;
  }
  return `✅ Cities added to monitoring: ${list}`;
}

/** Response when cities are removed from a group */
export function msgCitiesRemoved(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ ערים הוסרו מהמעקב: ${list}`;
  }
  return `✅ Cities removed from monitoring: ${list}`;
}

/** Response showing the current monitored cities */
export function msgCitiesList(cities: string[], language: 'he' | 'en'): string {
  if (cities.length === 0) {
    if (language === 'he') {
      return `📋 אין ערים במעקב עדיין.\nשלחו *!addcity שם עיר* כדי להתחיל.`;
    }
    return `📋 No cities being monitored yet.\nSend *!addcity city name* to get started.`;
  }

  const list = cities.map((c, i) => `${i + 1}. ${c}`).join('\n');
  if (language === 'he') {
    return `📋 *ערים שאני עוקב אחריהן:*\n${list}`;
  }
  return `📋 *Cities I'm watching:*\n${list}`;
}

/** Response when all cities are cleared */
export function msgCitiesCleared(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ כל הערים הוסרו. הולך לנוח 😴`;
  }
  return `✅ All cities cleared. Going to sleep 😴`;
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
    let msg = `🤖 *מה המצב?*\n\n`;
    msg += `וואטסאפ: ${wa}\n`;
    msg += `מערכת התרעות: ${ra}\n`;
    msg += `ערים במעקב: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `הודעות בתור: ${pendingMessages}\n`;
    }
    msg += `\n_אני ער 24/7, אל תדאגו_ 💪`;
    return msg;
  } else {
    const wa = whatsappConnected ? '🟢 Connected' : '🔴 Disconnected';
    const ra = redalertConnected ? '🟢 Connected' : '🔴 Disconnected';
    let msg = `🤖 *Status check*\n\n`;
    msg += `WhatsApp: ${wa}\n`;
    msg += `Alert system: ${ra}\n`;
    msg += `Cities watched: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `Queued messages: ${pendingMessages}\n`;
    }
    msg += `\n_I'm up 24/7, don't worry_ 💪`;
    return msg;
  }
}

/** Help message showing available commands */
export function msgHelp(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🤖 *הנה מה שאני יודע לעשות:*\n
*!addcity* עיר1, עיר2 - תוסיף ערים למעקב
*!removecity* עיר1 - תוריד עיר
*!cities* - מה אני עוקב אחריו
*!search* טקסט - חפש עיר במאגר (1,449 ערים!)
*!clearalerts* - תנקה הכל
*!lang* he/en - שנה שפה
*!status* - מה המצב שלי
*!test* - בדיקת חיים
*!help* - זה, מה שאתה רואה עכשיו 😄`;
  }
  return `🤖 *Here's what I can do:*\n
*!addcity* city1, city2 - Add cities to watch
*!removecity* city1 - Remove a city
*!cities* - What I'm watching
*!search* text - Search city database (1,449 cities!)
*!clearalerts* - Clear everything
*!lang* he/en - Change language
*!status* - How I'm doing
*!test* - Am I alive?
*!help* - This thing you're reading 😄`;
}

/** Error: city not found in config */
export function msgCityNotFound(city: string, language: 'he' | 'en'): string {
  if (language === 'he') {
    return `❌ "${city}" לא במעקב. בטוח שכתבת נכון?`;
  }
  return `❌ "${city}" isn't being monitored. Sure you spelled it right?`;
}

/** Language changed confirmation */
export function msgLanguageChanged(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ יאללה, עברית 🇮🇱`;
  }
  return `✅ Switched to English 🇬🇧`;
}
