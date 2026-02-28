/**
 * Message Templates - Hebrew and English alert messages
 *
 * All messages the bot sends to WhatsApp groups are defined here.
 * Supports both Hebrew (he) and English (en) languages.
 */

import { RedAlertEvent } from '../types';

// =====================
// Fun Facts for Shelter Time
// =====================

/** Random fun facts to show during alerts - lighten the mood */
const FUN_FACTS_HE: string[] = [
  'הידעת? ישראל היא המדינה היחידה בעולם שנכנסה לאלף השלישי עם יותר עצים ממה שהיו בה בתחילת המאה ה-20 🌳',
  'הידעת? כיפת ברזל מיירטת רקטות תוך שניות - אחת ממערכות ההגנה המתקדמות בעולם 🛡️',
  'הידעת? ים המלח הוא הנקודה הנמוכה ביותר על פני כדור הארץ - 430 מטר מתחת לפני הים 🌊',
  'הידעת? ישראל היא המדינה הראשונה בעולם שאסרה בחוק שימוש בדוגמניות תת-משקליות 👗',
  'הידעת? העגבנייה השרי פותחה בישראל בשנות ה-70 🍅',
  'הידעת? בישראל יש יותר מוזיאונים לנפש מכל מדינה אחרת בעולם 🎨',
  'הידעת? USB flash drive הומצא בישראל 💾',
  'הידעת? Waze, אפליקציית הניווט, פותחה בישראל 🗺️',
  'הידעת? ישראל היא המדינה היחידה בעולם שמיחזרת יותר מ-80% ממי השפכים לחקלאות 💧',
  'הידעת? בישראל פועלת התחנה הסולארית הגדולה ביותר במזרח התיכון - בנגב ☀️',
  'הידעת? חיפה היא אחת הערים הבודדות בעולם שבהן פועלת רכבת כבלים תת-קרקעית (כרמלית) 🚇',
  'הידעת? אילת היא אחד ממוקדי הצפרות הגדולים בעולם - חצי מיליארד ציפורים חולפות כל שנה 🦅',
  'הידעת? ישראל הייתה המדינה הראשונה שאימצה את מערכת ההשקיה בטפטוף 💦',
  'הידעת? המרחק מהנקודה הצפונית לדרומית של ישראל הוא רק 470 ק"מ 📏',
  'הידעת? ירושלים מוזכרת 669 פעמים בתנ"ך 📖',
  'הידעת? בבאר שבע יש את שדרת השחמט הגדולה ביותר בעולם ♟️',
  'הידעת? ישראל היא אחת משמונה המדינות בעולם שהצליחו לשגר לוויין לחלל באופן עצמאי 🚀',
  'הידעת? ICQ, תוכנת המסרים המיידיים הראשונה, פותחה בישראל ב-1996 💬',
  'הידעת? מצדה היא אתר מורשת עולמית של אונסק"ו ומבצר שבנה הורדוס לפני 2,000 שנה 🏰',
  'הידעת? לישראל יש את הכי הרבה סטארטאפים לנפש בעולם - "אומת הסטארטאפ" 🦄',
];

/** Pick a random fun fact */
function getRandomFunFact(): string {
  return FUN_FACTS_HE[Math.floor(Math.random() * FUN_FACTS_HE.length)];
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
  newsFlash: 'מבזק חדשות',
  // Drills
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
 * @param countdownSeconds - seconds to reach shelter (from city database), or null if unknown
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
    let msg = `📢 *התרעה - ${typeName}*\n\n`;
    msg += `*ערים:* ${cities}\n`;
    if (countdownSeconds) {
      msg += `*⏱ יש ${countdownSeconds} שניות להיכנס למרחב המוגן*\n`;
    }
    msg += `\nנכנסים למרחב המוגן ברוגע 🙏\n\n`;
    msg += `_${getRandomFunFact()}_`;
    return msg;
  } else {
    const typeName = ALERT_TYPE_NAMES_EN[alert.type] || alert.type;
    let msg = `📢 *Alert - ${typeName}*\n\n`;
    msg += `*Cities:* ${cities}\n`;
    if (countdownSeconds) {
      msg += `*⏱ ${countdownSeconds} seconds to reach shelter*\n`;
    }
    msg += `\nHead to your safe room calmly 🙏\n`;
    msg += `Everything will be okay.`;
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
    let msg = `⚡ *מבזק - שימו לב*\n\n`;
    msg += `*ערים:* ${cities}\n\n`;
    msg += `ייתכן שתישמע התרעה בדקות הקרובות.\n`;
    msg += `מומלץ להיות בקרבת מרחב מוגן.`;
    return msg;
  } else {
    let msg = `⚡ *Heads Up*\n\n`;
    msg += `*Cities:* ${cities}\n\n`;
    msg += `An alert may sound in the next few minutes.\n`;
    msg += `Stay near a shelter.`;
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
    let msg = `✅ *אפשר לצאת מהמרחב המוגן* 😊\n\n`;
    msg += `*ערים:* ${cities}\n`;
    msg += `שמרו על עצמכם 💙`;
    return msg;
  } else {
    let msg = `✅ *All clear - safe to leave the shelter* 😊\n\n`;
    msg += `*Cities:* ${cities}\n`;
    msg += `Stay safe 💙`;
    return msg;
  }
}

/**
 * Build a test alert message (for the !test command).
 */
export function buildTestAlertMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🧪 *הודעת בדיקה*\n\nזוהי הודעת בדיקה בלבד.\nהבוט פעיל ומחובר למערכת ההתרעות.`;
  } else {
    return `🧪 *Test Message*\n\nThis is only a test message.\nThe bot is active and connected to the alert system.`;
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
      return `📋 אין ערים במעקב.\nהשתמש ב- *!addcity* כדי להוסיף ערים.`;
    }
    return `📋 No cities being monitored.\nUse *!addcity* to add cities.`;
  }

  const list = cities.map((c, i) => `${i + 1}. ${c}`).join('\n');
  if (language === 'he') {
    return `📋 *ערים במעקב:*\n${list}`;
  }
  return `📋 *Monitored cities:*\n${list}`;
}

/** Response when all cities are cleared */
export function msgCitiesCleared(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ כל הערים הוסרו. הקבוצה לא תקבל התרעות.`;
  }
  return `✅ All cities cleared. This group will not receive alerts.`;
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
    const wa = whatsappConnected ? '✅ מחובר' : '❌ מנותק';
    const ra = redalertConnected ? '✅ מחובר' : '❌ מנותק';
    let msg = `📊 *סטטוס הבוט*\n\n`;
    msg += `WhatsApp: ${wa}\n`;
    msg += `RedAlert: ${ra}\n`;
    msg += `ערים במעקב: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `הודעות בתור: ${pendingMessages}\n`;
    }
    return msg;
  } else {
    const wa = whatsappConnected ? '✅ Connected' : '❌ Disconnected';
    const ra = redalertConnected ? '✅ Connected' : '❌ Disconnected';
    let msg = `📊 *Bot Status*\n\n`;
    msg += `WhatsApp: ${wa}\n`;
    msg += `RedAlert: ${ra}\n`;
    msg += `Monitored cities: ${cityCount}\n`;
    if (pendingMessages > 0) {
      msg += `Pending messages: ${pendingMessages}\n`;
    }
    return msg;
  }
}

/** Help message showing available commands */
export function msgHelp(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `📖 *פקודות זמינות:*\n
*!addcity* עיר1, עיר2 - הוסף ערים למעקב
*!removecity* עיר1 - הסר עיר מהמעקב
*!cities* - הצג ערים במעקב
*!search* טקסט - חפש עיר במאגר
*!clearalerts* - הסר את כל הערים
*!lang* he/en - שנה שפה
*!status* - סטטוס הבוט
*!test* - שלח הודעת בדיקה
*!help* - הצג פקודות`;
  }
  return `📖 *Available commands:*\n
*!addcity* city1, city2 - Add cities to monitor
*!removecity* city1 - Remove a city from monitoring
*!cities* - Show monitored cities
*!search* text - Search city database
*!clearalerts* - Remove all cities
*!lang* he/en - Change language
*!status* - Bot status
*!test* - Send test message
*!help* - Show commands`;
}

/** Error: city not found in config */
export function msgCityNotFound(city: string, language: 'he' | 'en'): string {
  if (language === 'he') {
    return `❌ העיר "${city}" לא נמצאה במעקב.`;
  }
  return `❌ City "${city}" is not being monitored.`;
}

/** Language changed confirmation */
export function msgLanguageChanged(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ השפה שונתה לעברית.`;
  }
  return `✅ Language changed to English.`;
}
