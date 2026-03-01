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
  buildTestAlertMessage,
} from '../utils/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('commands');

// =====================
// Main Handler
// =====================

/**
 * Process an incoming message and execute any command.
 * This is the main message handler passed to the WhatsApp service.
 */
export async function handleMessage(message: IncomingMessage): Promise<void> {
  // Only process group messages
  if (!message.isGroup) return;

  // Only process messages that start with "!"
  const body = message.body.trim();
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

  // !approve is admin-only and works even in unapproved groups
  if (command === '!approve') {
    if (!isAdmin(message.senderJid)) {
      await sendGroupMessage(
        message.chatId,
        '🔒 אופס, רק מנהל הבוט יכול לאשר קבוצות.'
      );
      return;
    }
    await handleApprove(message.chatId);
    return;
  }

  // All other commands require the group to be approved
  const config = groupConfig.getGroupConfig(message.chatId);
  if (!config || !config.enabled) {
    // Group not approved - explain and show group ID
    await sendGroupMessage(
      message.chatId,
      `👋 *היי! אני בוט התרעות מרחב מוגן* 🛡️\n\n` +
      `הקבוצה הזו עדיין לא מופעלת.\n` +
      `מנהל הבוט צריך לשלוח *!approve* כדי להפעיל אותי פה.\n\n` +
      `_Group ID: ${message.chatId}_`
    );
    return;
  }

  const lang = config.language || 'he';

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

    default:
      // Unknown command - ignore silently
      break;
  }
}

// =====================
// Command Implementations
// =====================

/**
 * !approve (admin only)
 * Approve this group to use the bot.
 */
async function handleApprove(groupId: string): Promise<void> {
  await groupConfig.approveGroup(groupId);

  await sendGroupMessage(
    groupId,
    `✅ *הקבוצה מופעלת!* 🎉\n\n` +
    `אני מוכן לעבודה 💪\n` +
    `*!search* - חפשו עיר\n` +
    `*!addcity* שם עיר - תוסיפו עיר למעקב\n` +
    `*!help* - כל הפקודות`
  );

  log.info({ groupId }, 'Group approved by admin');
}

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

// =====================
// Helpers
// =====================

/**
 * Check if a sender JID belongs to an admin.
 * Handles multiple JID formats:
 * - Phone: "972501234567@s.whatsapp.net"
 * - Phone with device: "972501234567:123@s.whatsapp.net"
 * - LID: "133088285880506@lid"
 * - LID with device: "133088285880506:59@lid"
 *
 * We check against ADMIN_NUMBERS which can contain phone numbers or LIDs.
 */
function isAdmin(senderJid: string): boolean {
  // Extract the number/id part before @ and before :
  const phone = senderJid.split('@')[0].split(':')[0];
  return ADMIN_NUMBERS.has(phone);
}
