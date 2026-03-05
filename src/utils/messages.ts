/**
 * Message Templates - Hebrew and English alert messages
 *
 * All messages the bot sends to WhatsApp groups are defined here.
 * Supports both Hebrew (he) and English (en) languages.
 * Tone: professional but warm.
 */

import { RedAlertEvent } from '../types';

// =====================
// Shelter Time Entertainment
// =====================

/** Fun/weird/mind-blowing facts to distract while sheltering */
const SHELTER_TIDBITS: string[] = [
  // Mind-blowing Israel stuff
  'ישראלים אוכלים הכי הרבה חומוס לנפש בעולם. והפתעה: גם הכי הרבה סושי במזרח התיכון 🍣',
  'כיפת ברזל מחשבת מסלול יירוט תוך 1-3 שניות. המחשב שלך לוקח יותר זמן לפתוח כרום 🛡️',
  'ים המלח יורד מטר בשנה. עד שהוא ייעלם, כבר נהיה על מאדים 🌊',
  'USB, Waze, ICQ, דיסק-און-קי, טפטפת, עגבניות שרי - כולם הומצאו בישראל. ארוחת הבוקר הכי חדשנית בעולם 🍅',
  'בישראל יש יותר סטארטאפים לנפש מכל מדינה אחרת. בפועל? יותר סטארטאפים מחניות חינם בתל אביב 🦄',
  'הכרמלית בחיפה היא הרכבת התחתית הכי קטנה בעולם. 6 תחנות. אפשר ללכת ברגל יותר מהר, אבל פחות כיף 🚇',
  'חצי מיליארד ציפורים עוברות דרך אילת כל שנה. יותר תיירים עם כנפיים מתיירים עם מזוודות 🦅',
  'ירושלים מוזכרת 669 פעמים בתנ"ך. תל אביב? אפס. הרגשות של ת"א נפגעו 📖',
  'ישראל שתלה כל כך הרבה עצים שהיא המדינה היחידה שנכנסה למאה ה-21 עם יותר עצים ממה שהתחילה איתם 🌳',
  'ישראל ממחזרת 90% ממי השפכים שלה. מקום שני? ספרד עם 20%. פשוט ליגה אחרת 💧',

  // Surprising trivia
  'דבש לא מתקלקל לעולם — מצאו דבש בן 3,000 שנה במצרים ועדיין היה ראוי לאכילה 🍯',
  'נפוליאון הותקף פעם בידי נחיל של ארנבות במהלך ציד מאורגן. הארנבות ניצחו 🐇',
  'אוסטרליה רחבה יותר מהירח. רוחב אוסטרליה: 4,000 ק"מ, קוטר הירח: 3,400 ק"מ 🌙',
  'נוגה (Venus) היא כוכב הלכת היחיד במערכת השמש שמסתובב בכיוון השעון 🪐',
  'הלשון של לוויתן כחול שוקלת כמו פיל שלם 🐋',
  'חיית המדינה הרשמית של סקוטלנד היא חד-קרן 🦄',
  'בננות זוהרות בכחול תחת אור אולטרה-סגול 🍌',
  'סלבדור דאלי עיצב את הלוגו של סוכריות צ\'ופה צ\'ופס 🎨',
  'ללובסטרים יש דם כחול 🦞',
  'סנטרל פארק בניו יורק גדול מכל שטח מדינת מונקו 🌳',
  'לתמנון יש 3 לבבות, דם כחול ו-9 מוחות 🐙',
  'צרפת מחזיקה ב-12 אזורי זמן — הכי הרבה מכל מדינה בעולם 🇫🇷',
  'תינוקות נולדים עם 275-300 עצמות, אבל למבוגר יש רק 206 👶',
  'אברהם לינקולן החזיק רישיון ברמנות 🍺',
  'ואן גוך מכר רק ציור אחד בחייו 🖼️',
  'הכבד הוא האיבר היחיד בגוף שמתחדש לחלוטין 🫀',
  'ענן ממוצע שוקל מעל 450 טון ☁️',
  'יש יותר כוכבים ביקום מגרגרי חול בכל חופי העולם ⭐',
  'דולפינים מעניקים לעצמם שמות — הם כמעט המין היחיד שעושה את זה מלבד בני אדם 🐬',
  'כל דגי הליצן נולדים זכרים ויכולים להפוך לנקבות בהמשך חייהם 🐠',
  'המוח שורף 400-500 קלוריות ביום — גם בלי להתאמץ 🧠',
  'סודן מכילה יותר פירמידות מכל מדינה אחרת בעולם, כולל מצרים 🏛️',
  'הקרב הקצר ביותר בהיסטוריה נמשך 38 דקות — בין בריטניה לזנזיבר ⚔️',
  'גוגל תמונות נוצר בגלל השמלה הירוקה של ג\'ניפר לופז בטקס הגראמי בשנת 2000 📸',
  'לימונים צפים במים, אבל ליימים שוקעים 🍋',
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
  '🎯 *אתגר 60 שניות:* כמה ערים ישראליות תוכלו לרשום ביחד תוך דקה?',
  '🧠 *שאלת חשיבה:* אם יכולתם להיות בכל מקום בעולם עכשיו — איפה הייתם?',
  '🎵 *אתגר מוזיקה:* שלחו שורה אחת מהשיר שנתקע לכם בראש',
  '🤔 *ויכוח חשוב:* מה עדיף — חומוס מסעדה או חומוס שוק? מצביעים!',
  '✏️ *משחק מילים:* מצאו עיר ישראלית שמתחילה בכל אות של שמכם',
  '🌟 *סבב חיובי:* כל אחד משתף משהו טוב שקרה לו השבוע',
  '🍕 *שאלה דחופה:* מה אתם הכי רוצים לאכול עכשיו?',
  '📱 *אתגר סמיילים:* כל אחד שולח הודעה בסמיילים בלבד — השאר מנחשים',
  '🏠 *תאור:* תארו את הממ"ד שלכם ב-3 מילים בלבד',
  '💭 *חלומות:* אם הייתה לכם חופשה מחר — מה הייתם עושים?',
  '🐾 *חיות:* אם הייתם חיה ישראלית, איזו הייתם? פלמינגו? צבי? נמייה?',
  '🔢 *ניחוש:* כמה קילומטרים מתל אביב לאילת? הנוחש הכי קרוב מנצח!',
  '🎬 *המלצות:* כל אחד מציין סרט ישראלי אחד שממליץ עליו',
  '🌈 *עיצוב:* אם הממ"ד שלכם היה בכל צבע שתרצו — איזה הייתם בוחרים?',
  '☕ *העדפות:* קפה שחור, עם חלב, או חלילה בלי קפה בכלל?',
  '🎲 *כמה שניות יש לכם?* נסו לנחש כמה שניות של מרחב מוגן יש בעיר שלכם',
  '💡 *המצאות:* אם הייתם ממציאים משהו לשפר את הממ"ד — מה הייתם ממציאים?',
  '🌍 *גאוגרפיה:* מי יכול לשלוח עיר ישראלית לכל אות ב-א-ב?',
  // This or that polls
  '🗳️ *הצבעה:* פיצה עם אננס — בעד או נגד? 🍍 כולם מצביעים!',
  '🌊 *ים או הרים?* כל אחד משיב מיד — ניצחון לפי רוב 🏔️',
  '🚗 *ויכוח נסיעות:* חניה בתל אביב — אפשרית או מיתוס? מצביעים!',
  // Breathing / physical
  '🫁 *רגע נשימה:* שאפו 4 שניות ← עצרו 4 ← נשפו 4. פעם אחת — מרגישים הבדל? 😌',
  // Year-specific (update if year changes)
  '🖊️ *מה הכותרת?* תארו את 2026 בכותרת עיתון אחת',
  // Creative / funny
  '🎭 *שחקן:* איזה שחקן ישראלי היה מגלם אתכם בסרט על הממ"ד שלכם?',
  '🎤 *קריוקי ממ"ד:* שלחו שם שיר שמתאים בול לרגע הזה',
  // Riddle
  '🧩 *חידה:* מה יש לך פעם אחת בדקה, פעמיים ברגע, ואף פעם לא באלף שנים?\n_(תשובה: האות ד)_',
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
    let msg = `🚨 *התראה - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `היכנסו למרחב המוגן, אודיע לכם מתי לצאת. 🙏\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  } else {
    const typeName = ALERT_TYPE_NAMES_EN[alert.type] || alert.type;
    let msg = `🚨 *Alert - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `Enter your safe room, I'll let you know when it's clear. 🙏\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  }
}

/**
 * Build the follow-up shelter activity message (sent right after the alert).
 */
export function buildActivityMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🎮 *בזמן שאתם שם:*\n${getRandomActivity()}\n\n_כיבוי: !activities off_`;
  }
  return `🎮 *While you're in there:*\n${getRandomActivity()}\n\n_disable: !activities off_`;
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
    let msg = `⚠️ *הודעה מקדימה*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `ייתכנו אזעקות בקרוב, ודאו שיש מרחב מוגן בקרבתכם.`;
    return msg;
  } else {
    let msg = `⚠️ *Advance Notice*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `Alerts may sound shortly. Make sure you have a safe room nearby.`;
    return msg;
  }
}

/**
 * Build the "safe to leave shelter" message for an end alert.
 * If durationMs is provided, the shelter time is included in the message.
 */
export function buildEndAlertMessage(
  clearedCities: string[],
  language: 'he' | 'en',
  durationMs?: number
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

  if (language === 'he') {
    let msg = `🚪 *האירוע הסתיים*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `ניתן לצאת מהמרחב המוגן. שמרו על עצמכם 💙`;
    if (durationLabel) msg += `\n\n⏱️ *${durationLabel} בממ"ד* — נשמו לרווחה 😮‍💨`;
    return msg;
  } else {
    let msg = `🚪 *Event Ended*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `You may leave the safe room. Stay safe 💙`;
    if (durationLabel) msg += `\n\n⏱️ *${durationLabel} in the shelter* — breathe easy 😮‍💨`;
    return msg;
  }
}

/**
 * Build a test alert message (for the !test command).
 */
export function buildTestAlertMessage(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `🧪 *בדיקה בדיקה*\n\nרגוע, זה סתם טסט 😄\nהבוט ער ומחובר למערכת.\n\n_${getRandomTidbit()}_`;
  } else {
    return `🧪 *Testing testing*\n\nRelax, just a test 😄\nBot is awake and connected.\n\n_${getRandomTidbit()}_`;
  }
}

// =====================
// Command Response Messages
// =====================

/** Response when cities are added to a group */
export function msgCitiesAdded(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ נוסף למעקב: ${list}`;
  }
  return `✅ Added to watch list: ${list}`;
}

/** Response when cities are removed from a group */
export function msgCitiesRemoved(cities: string[], language: 'he' | 'en'): string {
  const list = cities.join(', ');
  if (language === 'he') {
    return `✅ הוסר מהמעקב: ${list}`;
  }
  return `✅ Removed from watch list: ${list}`;
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
    return `📋 *ערים במעקב:*\n${list}`;
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
      msg += `הודעות ממתינות: ${pendingMessages}\n`;
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
*!addcity* עיר1, עיר2 - להוסיף ערים למעקב
*!removecity* עיר1 - להוריד עיר מהמעקב
*!cities* - להציג ערים במעקב
*!search* טקסט - לחפש עיר במאגר (1,449 ערים!)
*!clearalerts* - לנקות הכל
*!lang* he/en - לשנות שפה
*!status* - מה המצב שלי
*!test* - בדיקת חיים
*!activities* on/off - אתגרים קטנים בזמן האזעקה 🎮
*!ask* שאלה - לשאול את ה-AI כל שאלה 🤖
*אקו* שאלה - אותו דבר, רק יותר טבעי 😎
*!help* - מה שאתם רואים עכשיו 😄

💡 אפשר גם לתייג אותי או להגיב להודעה שלי ואני אענה!`;
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
*!activities* on/off - Mini shelter challenges 🎮
*!ask* question - Ask the AI anything 🤖
*echo* question - Same thing, just more natural 😎
*!help* - This thing you're reading 😄

💡 You can also @mention me or reply to my message and I'll respond!`;
}

/** Error: city not found in config */
export function msgCityNotFound(city: string, language: 'he' | 'en'): string {
  if (language === 'he') {
    return `❌ "${city}" לא נמצא במעקב. בטוחים שכתבתם נכון?`;
  }
  return `❌ "${city}" isn't being monitored. Sure you spelled it right?`;
}

/** Welcome message sent when the bot joins a group for the first time */
export function msgWelcome(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `👋 שלום לכולם! אני בוט שמחובר למערכת ההתרעות של פיקוד העורף — יודע בדיוק מתי לומר לכם להיכנס לממ"ד ומתי אפשר לצאת.\n\nכדי להתחיל:\n• *!addcity* שם עיר — להוסיף עיר למעקב\n• *!help* — לכל הפקודות\n\nאפשר גם לדבר איתי — כתבו *אקו* לפני כל שאלה 🤖`;
  }
  return `👋 Hey everyone! I'm connected to the Pikud HaOref alert system — I'll tell you exactly when to get to your shelter and when it's safe to come out.\n\nTo get started:\n• *!addcity* city name — add a city to watch\n• *!help* — see all commands\n\nYou can also chat with me — just write *echo* before any question 🤖`;
}

/** Language changed confirmation */
export function msgLanguageChanged(language: 'he' | 'en'): string {
  if (language === 'he') {
    return `✅ יאללה, עברית 🇮🇱`;
  }
  return `✅ Switched to English 🇬🇧`;
}
