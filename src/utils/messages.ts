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

  // Random weird & wonderful
  'לתמנון יש 3 לבבות, דם כחול ו-9 מוחות. בעצם, הוא מוכשר יותר מרובנו 🐙',
  'דבש לא מתקלקל לעולם. מצאו דבש בן 3,000 שנה במצרים ועדיין אפשר לאכול אותו. תאריך תפוגה? לא מכירים 🍯',
  'כלבים יודעים להריח אם עצוב לכם. חתולים? גם יודעים. פשוט לא אכפת להם 🐕',
  'נמלים לא ישנות לעולם. אולי בגלל זה הן תמיד כזה עצבניות 🐜',
  'קואלות ישנות 22 שעות ביום. מצד שני, הן לא צריכות להכין ארוחת בוקר לילדים 🐨',
  'הלב של שרימפס נמצא בראש שלו. לפחות הוא חושב עם הלב, לא? 🦐',
  'פרפרים טועמים עם הרגליים. אוקיי, זה פשוט מגעיל 🦋',
  'בננה היא מבחינה טכנית סוג של גרגר. תות שדה? דווקא לא. העולם הזה שקרי 🍌',
  'לג׳ירפה ולבן אדם יש אותו מספר חוליות צוואר: 7. אבל רק אחד מהם מרגיש מוזר עם צוואר קצר 🦒',
  'יותר אנשים נפגעים בשנה ממכונות שתייה אוטומטיות מאשר מכרישים. המכונות מנצחות 🦈',

  // Existential & wholesome
  'יש יותר כוכבים ביקום מגרגרי חול בכל חופי העולם ביחד. אנחנו קטנים. בצורה טובה ⭐',
  'עצי אקליפטוס משחררים שמנים שיוצרים ערפל כחלחל. לכן ההרים הכחולים באוסטרליה באמת כחולים 🏔️',
  'הצבע כתום קיבל את השם שלו מהפרי, לא להפך. לפני כן קראו לצבע "אדום-צהוב". עצלנים 🍊',
  'תינוקות נולדים בלי פיקות ברך. הן מתפתחות רק אחר כך. תינוקות הם בעצם חייזרים רכים 👶',
  'מדוזות חיות כבר 650 מיליון שנה בלי מוח, לב או עצמות. ועדיין שורדות. מעוררות השראה 🪼',
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
// Streak Messages
// =====================

/** Format streak duration in Hebrew or English */
function formatStreakDuration(hours: number, language: 'he' | 'en'): string {
  if (language === 'he') {
    if (hours < 24) return `${hours} שעות`;
    if (hours < 48) return 'יום שלם';
    if (hours < 168) return `${Math.round(hours / 24)} ימים`;
    return 'שבוע שלם';
  } else {
    if (hours < 24) return `${hours} hours`;
    if (hours < 48) return 'a full day';
    if (hours < 168) return `${Math.round(hours / 24)} days`;
    return 'a full week';
  }
}

/** Casual Hebrew/English comments per milestone */
const STREAK_COMMENTS: Record<number, { he: string; en: string }> = {
  6:   { he: 'נושמים רגע ☀️', en: 'Taking a breath ☀️' },
  12:  { he: 'חצי יום של שקט — נהנים ממנו 😎', en: 'Half a day of quiet — enjoying it 😎' },
  24:  { he: 'יום שלם ללא אזעקות. ממשיכים כך 💙', en: 'A full day without alerts. Let\'s keep it 💙' },
  48:  { he: 'יומיים! כבר אפשר להירגע קצת 😌', en: 'Two days! Starting to relax 😌' },
  72:  { he: 'שלושה ימים. נראה טוב מאוד 💪', en: 'Three days. Looking really good 💪' },
  168: { he: 'שבוע שלם! זה ממש מרשים 🌟', en: 'A whole week! That\'s seriously impressive 🌟' },
};

/**
 * Build a streak milestone announcement message.
 * @param hours - Which milestone (6, 12, 24, 48, 72, or 168)
 * @param isRecord - Whether this beats the group's previous record
 * @param language - Message language
 */
export function buildStreakMilestoneMessage(
  hours: number,
  isRecord: boolean,
  language: 'he' | 'en'
): string {
  const duration = formatStreakDuration(hours, language);
  const comment = STREAK_COMMENTS[hours] ?? { he: 'רגוע פה 🕊️', en: 'Quiet here 🕊️' };

  if (language === 'he') {
    if (isRecord) {
      return `🏆 *שיא חדש!*\n\nכבר *${duration}* ללא אזעקות — הכי ארוך שהיה! ממשיכים לשמור 🤞\n\n_כיבוי: !streak off_`;
    }
    return `🕊️ *${duration} ללא אזעקות*\n\n${comment.he}\n\n_כיבוי: !streak off_`;
  } else {
    if (isRecord) {
      return `🏆 *New record!*\n\n*${duration}* without alerts — personal best! Keep it going 🤞\n\n_disable: !streak off_`;
    }
    return `🕊️ *${duration} without alerts*\n\n${comment.en}\n\n_disable: !streak off_`;
  }
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
    let msg = `📢 *יאללה, ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `זזים למרחב המוגן ברוגע, בלי פאניקה 🙏\n\n`;
    msg += `_${getRandomTidbit()}_`;
    return msg;
  } else {
    const typeName = ALERT_TYPE_NAMES_EN[alert.type] || alert.type;
    let msg = `📢 *Heads up - ${typeName}*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `Move to your safe room, no panic 🙏\n\n`;
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
 * Build a wrap-up message sent after shelter fully clears,
 * summarising how long the group was in shelter.
 */
export function buildShelterWrapUpMessage(durationMs: number, language: 'he' | 'en'): string {
  const minutes = Math.round(durationMs / 60_000);

  if (language === 'he') {
    const label =
      minutes < 1 ? 'פחות מדקה' :
      minutes === 1 ? 'כדקה' :
      `כ-${minutes} דקות`;
    return `⏱️ *${label} בממ"ד* — כולם בחוץ? 🤞`;
  } else {
    const label =
      minutes < 1 ? 'under a minute' :
      minutes === 1 ? 'about 1 minute' :
      `about ${minutes} minutes`;
    return `⏱️ *${label} in the shelter* — everyone out? 🤞`;
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
    let msg = `⚡ *שימו לב*\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `ייתכן שתישמע התרעה בדקות הקרובות.\n`;
    msg += `כדאי להיות ליד מרחב מוגן 😎`;
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
    let msg = `✅ *נגמר! אפשר לצאת* 🎉\n\n`;
    msg += `📍 ${cities}\n\n`;
    msg += `חוזרים לשגרה. שמרו על עצמכם 💙`;
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
*!streak* on/off - מד שעות שקט בין אזעקות ⏱️
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
*!streak* on/off - Silence streak milestones ⏱️
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
