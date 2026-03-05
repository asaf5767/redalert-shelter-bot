/**
 * Command Handler - processes chat commands from WhatsApp groups
 *
 * All commands start with "!" prefix.
 * Commands are case-insensitive.
 *
 * Available commands:
 *   !addcity city1, city2   - Add cities to monitor
 *   !removecity city1       - Remove a city
 *   !cities                 - List monitored cities
 *   !clearalerts            - Stop all monitoring
 *   !lang he/en             - Change message language
 *   !status                 - Show bot status
 *   !test                   - Send test message
 *   !help                   - Show commands
 */

import { IncomingMessage } from '../types';
import { ADMIN_NUMBERS } from '../config';
import * as groupConfig from './group-config';
import {
  sendGroupMessage,
  isWhatsAppConnected,
  getPendingMessageCount,
  getBotJid,
  getBotLid,
  reactToMessage,
} from '../services/whatsapp';
import { isRedAlertConnected } from '../services/redalert';
import { searchCities, findCity, getCityCount } from './city-database';
import {
  msgCitiesAdded,
  msgCitiesRemoved,
  msgCitiesList,
  msgCitiesCleared,
  msgStatus,
  msgHelp,
  msgLanguageChanged,
  msgWelcome,
  buildTestAlertMessage,
} from '../utils/messages';
import { askAI, isAIEnabled } from '../services/ai';
import { getConversationHistory, saveMessage } from '../services/supabase';
import { createLogger } from '../utils/logger';
import { BOT_PHONE_NUMBER } from '../config';
import { setActivitiesEnabled } from './group-config';

const log = createLogger('commands');

// =====================
// Main Handler
// =====================

/**
 * Process an incoming message and execute any command.
 * This is the main message handler passed to the WhatsApp service.
 *
 * Supports two trigger styles:
 * 1. Classic commands: !addcity, !help, etc.
 * 2. Echo triggers: "אקו ...", "echo ...", @mention the bot, or reply to the bot's message
 */
export async function handleMessage(message: IncomingMessage): Promise<void> {
  const body = message.body.trim();

  // Check for Echo triggers (natural language AI invocation)
  const echoQuestion = extractEchoQuestion(message);
  if (echoQuestion !== null) {
    // Auto-create group config if it doesn't exist yet
    let config = groupConfig.getGroupConfig(message.chatId);
    if (!config) {
      await groupConfig.approveGroup(message.chatId);
      config = groupConfig.getGroupConfig(message.chatId);
    }
    const lang = config?.language || 'he';
    await handleAsk(message.chatId, echoQuestion, lang, message.senderName, message.messageKey);
    return;
  }

  // In personal chats, every non-command message is implicitly directed at the bot
  if (!message.isGroup && !body.startsWith('!')) {
    let config = groupConfig.getGroupConfig(message.chatId);
    if (!config) {
      await groupConfig.approveGroup(message.chatId);
      config = groupConfig.getGroupConfig(message.chatId);
    }
    const lang = config?.language || 'he';
    await handleAsk(message.chatId, body, lang, message.senderName, message.messageKey);
    return;
  }

  // Only process messages that start with "!"
  if (!body.startsWith('!')) return;

  // Parse the command and arguments
  const spaceIndex = body.indexOf(' ');
  const command = (spaceIndex > 0 ? body.substring(0, spaceIndex) : body)
    .toLowerCase();
  const args = spaceIndex > 0 ? body.substring(spaceIndex + 1).trim() : '';

  log.info(
    { command, args, sender: message.senderName, group: message.chatId },
    'Processing command'
  );

  // Auto-create group config if it doesn't exist yet
  let config = groupConfig.getGroupConfig(message.chatId);
  if (!config) {
    await groupConfig.approveGroup(message.chatId);
    config = groupConfig.getGroupConfig(message.chatId);
  }

  const lang = config?.language || 'he';

  // Route to the appropriate handler
  switch (command) {
    case '!addcity':
    case '!addcities':
      await handleAddCity(message.chatId, args, message.senderName, lang);
      break;

    case '!removecity':
    case '!removecities':
      await handleRemoveCity(message.chatId, args, lang);
      break;

    case '!cities':
    case '!list':
      await handleListCities(message.chatId, lang);
      break;

    case '!clearalerts':
    case '!clear':
      await handleClearAlerts(message.chatId, lang);
      break;

    case '!search':
    case '!find':
      await handleSearch(message.chatId, args, lang);
      break;

    case '!lang':
    case '!language':
      await handleLanguage(message.chatId, args);
      break;

    case '!status':
      await handleStatus(message.chatId, lang);
      break;

    case '!test':
      await handleTest(message.chatId, lang);
      break;

    case '!help':
      await handleHelp(message.chatId, lang);
      break;

    case '!ask':
    case '!ai':
      await handleAsk(message.chatId, args, lang, message.senderName, message.messageKey);
      break;

    case '!activities':
    case '!activity':
      await handleActivities(message.chatId, args, lang);
      break;

    default:
      // Unknown command - ignore silently
      break;
  }
}

// =====================
// Command Implementations
// =====================

/**
 * !addcity city1, city2, city3
 * Add one or more cities to this group's monitoring list.
 */
async function handleAddCity(
  groupId: string,
  args: string,
  senderName: string,
  lang: 'he' | 'en'
): Promise<void> {
  if (!args) {
    const hint =
      lang === 'he'
        ? '❌ נא לציין ערים. דוגמה: *!addcity תל אביב, חיפה*'
        : '❌ Please specify cities. Example: *!addcity Tel Aviv, Haifa*';
    await sendGroupMessage(groupId, hint);
    return;
  }

  // Split by comma and clean up
  const cities = args
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (cities.length === 0) {
    const hint =
      lang === 'he'
        ? '❌ נא לציין לפחות עיר אחת.'
        : '❌ Please specify at least one city.';
    await sendGroupMessage(groupId, hint);
    return;
  }

  // Validate cities against the database and resolve to official names
  const validCities: string[] = [];
  const unknownCities: string[] = [];

  for (const city of cities) {
    const found = findCity(city);
    if (found) {
      validCities.push(found.name); // Use official Hebrew name
    } else {
      unknownCities.push(city);
    }
  }

  // Warn about unknown cities
  if (unknownCities.length > 0) {
    const unknownList = unknownCities.join(', ');
    const hint =
      lang === 'he'
        ? `⚠️ לא נמצאו במאגר: ${unknownList}\nהשתמש ב- *!search* כדי לחפש שם נכון.`
        : `⚠️ Not found in database: ${unknownList}\nUse *!search* to find the correct name.`;
    await sendGroupMessage(groupId, hint);
  }

  if (validCities.length === 0) return;

  const added = await groupConfig.addCities(groupId, validCities);

  if (added.length > 0) {
    // Show countdown info for added cities
    const lines = added.map((c) => {
      const info = findCity(c);
      const seconds = info?.countdown || '?';
      return lang === 'he'
        ? `• ${c} (${seconds} שניות למרחב המוגן)`
        : `• ${c} (${seconds}s to shelter)`;
    });
    const header =
      lang === 'he' ? '✅ *ערים נוספו למעקב:*' : '✅ *Cities added:*';
    await sendGroupMessage(groupId, `${header}\n${lines.join('\n')}`);
  } else {
    const msg =
      lang === 'he'
        ? '✅ כל הערים כבר במעקב.'
        : '✅ All cities are already being monitored.';
    await sendGroupMessage(groupId, msg);
  }
}

/**
 * !removecity city1, city2
 * Remove one or more cities from this group's monitoring list.
 */
async function handleRemoveCity(
  groupId: string,
  args: string,
  lang: 'he' | 'en'
): Promise<void> {
  if (!args) {
    const hint =
      lang === 'he'
        ? '❌ נא לציין ערים להסרה. דוגמה: *!removecity חיפה*'
        : '❌ Please specify cities. Example: *!removecity Haifa*';
    await sendGroupMessage(groupId, hint);
    return;
  }

  const cities = args
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const removed = await groupConfig.removeCities(groupId, cities);

  if (removed.length > 0) {
    await sendGroupMessage(groupId, msgCitiesRemoved(removed, lang));
  } else {
    const msg =
      lang === 'he'
        ? '❌ הערים שצוינו לא נמצאו במעקב.'
        : '❌ None of the specified cities were being monitored.';
    await sendGroupMessage(groupId, msg);
  }
}

/**
 * !cities
 * Show the list of cities this group is monitoring.
 */
async function handleListCities(
  groupId: string,
  lang: 'he' | 'en'
): Promise<void> {
  const config = groupConfig.getGroupConfig(groupId);
  const cities = config?.cities || [];
  await sendGroupMessage(groupId, msgCitiesList(cities, lang));
}

/**
 * !clearalerts
 * Remove all cities from this group (stop receiving alerts).
 */
async function handleClearAlerts(
  groupId: string,
  lang: 'he' | 'en'
): Promise<void> {
  await groupConfig.clearCities(groupId);
  await sendGroupMessage(groupId, msgCitiesCleared(lang));
}

/**
 * !search <query>
 * Search the city database for matching cities.
 * Searches both Hebrew and English names.
 */
async function handleSearch(
  groupId: string,
  args: string,
  lang: 'he' | 'en'
): Promise<void> {
  if (!args) {
    const hint =
      lang === 'he'
        ? `❌ נא לציין טקסט לחיפוש. דוגמה: *!search ראש*\n📊 ${getCityCount()} ערים במאגר.`
        : `❌ Please specify search text. Example: *!search rosh*\n📊 ${getCityCount()} cities in database.`;
    await sendGroupMessage(groupId, hint);
    return;
  }

  const results = searchCities(args, 10);

  if (results.length === 0) {
    const msg =
      lang === 'he'
        ? `❌ לא נמצאו תוצאות עבור "${args}".`
        : `❌ No results found for "${args}".`;
    await sendGroupMessage(groupId, msg);
    return;
  }

  const lines = results.map((c) => {
    return `• *${c.name}* (${c.name_en}) - ${c.zone} - ${c.countdown} ${lang === 'he' ? 'שניות' : 'sec'}`;
  });

  const header =
    lang === 'he'
      ? `🔍 *תוצאות חיפוש* (${results.length}):`
      : `🔍 *Search results* (${results.length}):`;

  const footer =
    lang === 'he'
      ? '\nהשתמש ב- *!addcity שם* כדי להוסיף עיר.'
      : '\nUse *!addcity name* to add a city.';

  await sendGroupMessage(groupId, `${header}\n${lines.join('\n')}${footer}`);
}

/**
 * !lang he/en
 * Change the message language for this group.
 */
async function handleLanguage(groupId: string, args: string): Promise<void> {
  const lang = args.trim().toLowerCase();

  if (lang !== 'he' && lang !== 'en') {
    await sendGroupMessage(
      groupId,
      '❌ Supported languages: *he* (Hebrew), *en* (English)\nשפות נתמכות: *he* (עברית), *en* (אנגלית)'
    );
    return;
  }

  await groupConfig.setLanguage(groupId, lang);
  await sendGroupMessage(groupId, msgLanguageChanged(lang));
}

/**
 * !status
 * Show bot connection status and monitoring info.
 */
async function handleStatus(
  groupId: string,
  lang: 'he' | 'en'
): Promise<void> {
  const config = groupConfig.getGroupConfig(groupId);
  const cityCount = config?.cities.length || 0;

  await sendGroupMessage(
    groupId,
    msgStatus(
      isWhatsAppConnected(),
      isRedAlertConnected(),
      cityCount,
      getPendingMessageCount(),
      lang
    )
  );
}

/**
 * !test
 * Send a test alert message to verify the bot is working.
 */
async function handleTest(
  groupId: string,
  lang: 'he' | 'en'
): Promise<void> {
  await sendGroupMessage(groupId, buildTestAlertMessage(lang));
}

/**
 * !help
 * Show the list of available commands.
 */
async function handleHelp(
  groupId: string,
  lang: 'he' | 'en'
): Promise<void> {
  await sendGroupMessage(groupId, msgHelp(lang));
}

/**
 * !ask <question> / אקו <question> / @mention / reply-to-bot
 * Ask Echo (Google Gemini) a question with conversation context.
 */
async function handleAsk(
  groupId: string,
  args: string,
  lang: 'he' | 'en',
  senderName?: string,
  messageKey?: IncomingMessage['messageKey']
): Promise<void> {
  if (!isAIEnabled()) {
    const msg =
      lang === 'he'
        ? '❌ תכונת ה-AI לא מופעלת על השרת.'
        : '❌ AI feature is not enabled on this server.';
    await sendGroupMessage(groupId, msg);
    return;
  }

  if (!args) {
    const hint =
      lang === 'he'
        ? '🤖 מה אתה רוצה לשאול? דוגמה: *אקו כמה זמן נשארים במרחב מוגן?*'
        : '🤖 What do you want to ask? Example: *echo how long should I stay in the shelter?*';
    await sendGroupMessage(groupId, hint);
    return;
  }

  // Instantly react to acknowledge the message
  if (messageKey) {
    reactToMessage(messageKey, '🤔');
  }

  try {
    // Build bot number list for identifying bot messages in history
    const botNumbers: string[] = [];
    const botJid = getBotJid();
    if (botJid) botNumbers.push(botJid.split('@')[0].split(':')[0]);
    if (BOT_PHONE_NUMBER) botNumbers.push(BOT_PHONE_NUMBER);

    // Fetch recent conversation history from Supabase
    const history = await getConversationHistory(groupId, botNumbers, 10);

    const response = await askAI(args, history, senderName);
    const fullResponse = `🤖 ${response}`;
    await sendGroupMessage(groupId, fullResponse);

    // Save bot's response to DB for conversation continuity
    const botJidNum = getBotJid()?.split('@')[0]?.split(':')[0] || BOT_PHONE_NUMBER || 'bot';
    saveMessage({
      id: `echo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chat_id: groupId,
      chat_name: null,
      sender_name: 'Echo',
      sender_number: botJidNum,
      message_type: 'text',
      body: fullResponse,
      timestamp: Math.floor(Date.now() / 1000),
      from_me: true,
      is_group: groupId.endsWith('@g.us'),
      is_content: true,
    }).catch(() => {}); // Fire and forget
  } catch (err) {
    log.error({ err }, 'AI request failed');
    const errMsg =
      lang === 'he'
        ? '❌ אופס, ה-AI לא הצליח לענות. נסה שוב.'
        : '❌ Oops, AI failed to respond. Try again.';
    await sendGroupMessage(groupId, errMsg);
  }
}

/**
 * !activities on/off
 * Toggle shelter activity prompts appended to alert messages.
 */
async function handleActivities(
  groupId: string,
  args: string,
  lang: 'he' | 'en'
): Promise<void> {
  const config = groupConfig.getGroupConfig(groupId);
  if (!config) return;

  const arg = args.trim().toLowerCase();

  if (arg !== 'on' && arg !== 'off') {
    const isOn = config.settings.activitiesEnabled !== false;
    const current = isOn ? (lang === 'he' ? 'פעיל ✅' : 'on ✅') : (lang === 'he' ? 'כבוי ❌' : 'off ❌');
    const hint = lang === 'he'
      ? `🎮 *פעילויות בממ"ד* — מוסיף אתגר קטן להודעות האזעקה כדי לעבור את הזמן.\n\nמצב נוכחי: ${current}\n\nשלחו *!activities on* להפעיל או *!activities off* לכבות.`
      : `🎮 *Shelter activities* — adds a mini challenge to alert messages to pass the time.\n\nCurrent: ${current}\n\nSend *!activities on* to enable or *!activities off* to disable.`;
    await sendGroupMessage(groupId, hint);
    return;
  }

  const enabled = arg === 'on';
  await setActivitiesEnabled(groupId, enabled);

  const msg = lang === 'he'
    ? enabled
      ? `🎮 פעילויות בממ"ד הופעלו! בפעם הבאה שתהיה אזעקה, אוסיף אתגר קטן 😄`
      : `🎮 פעילויות בממ"ד כובו.`
    : enabled
      ? `🎮 Shelter activities enabled! Next alert will include a mini challenge 😄`
      : `🎮 Shelter activities disabled.`;

  await sendGroupMessage(groupId, msg);
}

// =====================
// Group Join
// =====================

/**
 * Called when the bot is added to a group.
 * Creates the group config (if needed) and sends a welcome message.
 */
export async function handleGroupJoin(groupId: string): Promise<void> {
  let config = groupConfig.getGroupConfig(groupId);
  if (!config) {
    await groupConfig.approveGroup(groupId);
    config = groupConfig.getGroupConfig(groupId);
  }
  const lang = config?.language || 'he';
  await sendGroupMessage(groupId, msgWelcome(lang));
}

// =====================
// Helpers
// =====================

/** Echo trigger keywords (case-insensitive) */
const ECHO_KEYWORDS = ['אקו', 'echo'];

/**
 * Check if a message is an Echo trigger and extract the question.
 * Returns the question text, or null if not an Echo trigger.
 *
 * Triggers:
 * - "אקו מה השעה?" or "שמע אקו אתה מצחיק" (keyword anywhere)
 * - @mention the bot + any text
 * - Reply to a bot message + any text
 */
function extractEchoQuestion(message: IncomingMessage): string | null {
  const body = message.body.trim();
  const lowerBody = body.toLowerCase();

  // 1. Check if "אקו" or "echo" appears anywhere in the message
  for (const keyword of ECHO_KEYWORDS) {
    if (lowerBody.includes(keyword)) {
      // Remove the keyword from the message to get the actual question
      // Use regex to remove the keyword (case-insensitive) and clean up
      const cleaned = body.replace(new RegExp(keyword, 'gi'), '').trim();
      return cleaned || '';
    }
  }

  // 2. Check for @mention of the bot
  if (message.mentionedJids && message.mentionedJids.length > 0 && isBotMentioned(message.mentionedJids)) {
    // Strip the @mention from the text (it shows as @phonenumber)
    const cleaned = body.replace(/@\d+/g, '').trim();
    return cleaned || '';
  }

  // 3. Check for reply to a bot message
  if (message.quotedParticipant && isBotJid(message.quotedParticipant)) {
    return body || '';
  }

  return null;
}

/**
 * Check if any of the mentioned JIDs belong to the bot.
 */
function isBotMentioned(mentionedJids: string[]): boolean {
  return mentionedJids.some(jid => isBotJid(jid));
}

/**
 * Check if a JID belongs to the bot.
 * Checks against both the bot's phone JID and LID (internal WhatsApp ID).
 * WhatsApp uses LID format in quotedParticipant for replies.
 * - Phone JID: "972501234567@s.whatsapp.net" or "972501234567:123@s.whatsapp.net"
 * - LID: "123456789012345@lid" or "123456789012345:59@lid"
 */
function isBotJid(jid: string): boolean {
  const extractId = (j: string) => j.split('@')[0].split(':')[0];
  const targetId = extractId(jid);

  const botJid = getBotJid();
  if (botJid && extractId(botJid) === targetId) return true;

  const botLid = getBotLid();
  if (botLid && extractId(botLid) === targetId) return true;

  // Also check against configured phone number as fallback
  if (BOT_PHONE_NUMBER && BOT_PHONE_NUMBER === targetId) return true;

  return false;
}

/**
 * Check if a sender JID belongs to an admin.
 * Handles multiple JID formats:
 * - Phone: "972501234567@s.whatsapp.net"
 * - Phone with device: "972501234567:123@s.whatsapp.net"
 * - LID: "123456789012345@lid"
 * - LID with device: "123456789012345:59@lid"
 *
 * We check against ADMIN_NUMBERS which can contain phone numbers or LIDs.
 */
function isAdmin(senderJid: string): boolean {
  // Extract the number/id part before @ and before :
  const phone = senderJid.split('@')[0].split(':')[0];
  return ADMIN_NUMBERS.has(phone);
}
