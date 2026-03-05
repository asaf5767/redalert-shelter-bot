/**
 * Group Config Manager - per-group city configuration
 *
 * Manages which cities each WhatsApp group is monitoring for alerts.
 * Keeps an in-memory cache synced with the Supabase database.
 *
 * Usage:
 *   await groupConfig.init();              // Load from DB on startup
 *   groupConfig.addCities(groupId, [...])  // Add cities via chat command
 *   groupConfig.getMatchingGroups(cities)  // Find groups for an alert
 */

import { GroupConfig, GroupConfigRow, GroupSettings } from '../types';
import { loadGroupConfigs, saveGroupConfig, checkSettingsColumn } from '../services/supabase';
import { getInitialGroups } from '../config';
import { createLogger } from '../utils/logger';

const log = createLogger('group-config');

// In-memory cache: groupId -> GroupConfig
const configs = new Map<string, GroupConfig>();

// =====================
// Initialization
// =====================

/**
 * Initialize the group config manager.
 * Loads configs from Supabase, then seeds any INITIAL_GROUPS from env.
 */
export async function init(): Promise<void> {
  // Verify the settings column exists (warns loudly if missing)
  await checkSettingsColumn();

  // Load existing configs from database
  const rows = await loadGroupConfigs();

  for (const row of rows) {
    configs.set(row.group_id, {
      groupId: row.group_id,
      groupName: row.group_name || '',
      cities: row.cities || [],
      language: (row.language as 'he' | 'en') || 'he',
      enabled: row.enabled,
      settings: (row.settings as GroupSettings) || {},
    });
  }

  log.info({ count: configs.size }, 'Loaded group configs from database');

  // Seed initial groups from env (only if they don't exist in DB yet)
  const initialGroups = getInitialGroups();
  for (const group of initialGroups) {
    if (!configs.has(group.groupId)) {
      log.info(
        { groupId: group.groupId, cities: group.cities },
        'Seeding initial group config'
      );
      await addCities(
        group.groupId,
        group.cities,
        group.groupName || 'Initial Group'
      );
    }
  }
}

// =====================
// Read Operations
// =====================

/** Get the config for a specific group (or null if not configured) */
export function getGroupConfig(groupId: string): GroupConfig | null {
  return configs.get(groupId) || null;
}

/** Get all group configs */
export function getAllConfigs(): GroupConfig[] {
  return Array.from(configs.values());
}

/**
 * Find all groups that are monitoring ANY of the given cities.
 * Returns an array of { config, matchedCities } objects.
 *
 * City matching is case-insensitive and trimmed.
 */
export function getMatchingGroups(
  alertCities: string[]
): Array<{ config: GroupConfig; matchedCities: string[] }> {
  const results: Array<{ config: GroupConfig; matchedCities: string[] }> = [];

  // Normalize alert city names for comparison
  const normalizedAlertCities = alertCities.map((c) => c.trim().toLowerCase());

  for (const config of configs.values()) {
    if (!config.enabled || config.cities.length === 0) continue;

    // Find which of this group's cities match the alert
    // Matching rules:
    // 1. Exact match: "כרמל" == "כרמל"
    // 2. Prefix with separator: "ראש העין" matches "ראש העין - מזרח"
    //    (group city is a prefix of alert city, followed by space/dash)
    // 3. Suffix with separator: "ראש העין - מזרח" matches "ראש העין"
    //    (alert city is a prefix of group city, followed by space/dash)
    // NOT: "כרמל" should NOT match "טירת כרמל" (substring in middle)
    const matched: string[] = [];
    for (const groupCity of config.cities) {
      const gc = groupCity.trim().toLowerCase();
      for (let i = 0; i < normalizedAlertCities.length; i++) {
        const ac = normalizedAlertCities[i];
        if (isCityMatch(gc, ac)) {
          if (!matched.includes(alertCities[i])) {
            matched.push(alertCities[i]);
          }
        }
      }
    }

    if (matched.length > 0) {
      results.push({ config, matchedCities: matched });
    }
  }

  return results;
}

// =====================
// Write Operations
// =====================

/** Persist a config object to Supabase */
async function save(config: GroupConfig): Promise<void> {
  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: config.enabled,
    settings: config.settings,
  });
}

/**
 * Approve a group to use the bot.
 * Creates the config entry if it doesn't exist, sets enabled=true.
 */
export async function approveGroup(groupId: string): Promise<void> {
  let config = configs.get(groupId);

  if (!config) {
    config = {
      groupId,
      groupName: '',
      cities: [],
      language: 'he',
      enabled: true,
      settings: {},
    };
  } else {
    config.enabled = true;
  }

  configs.set(groupId, config);
  await save(config);
  log.info({ groupId }, 'Group approved');
}

/**
 * Add cities to a group's monitoring list.
 * Creates the group config if it doesn't exist.
 * Saves to database automatically.
 */
export async function addCities(
  groupId: string,
  cities: string[],
  groupName?: string
): Promise<string[]> {
  let config = configs.get(groupId);

  if (!config) {
    // Create new config for this group
    config = {
      groupId,
      groupName: groupName || '',
      cities: [],
      language: 'he',
      enabled: true,
      settings: {},
    };
  }

  // Update group name if provided
  if (groupName) {
    config.groupName = groupName;
  }

  // Add cities that aren't already monitored (case-insensitive dedup)
  const existingLower = new Set(config.cities.map((c) => c.trim().toLowerCase()));
  const added: string[] = [];

  for (const city of cities) {
    const trimmed = city.trim();
    if (trimmed && !existingLower.has(trimmed.toLowerCase())) {
      config.cities.push(trimmed);
      existingLower.add(trimmed.toLowerCase());
      added.push(trimmed);
    }
  }

  // Save to memory and database
  configs.set(groupId, config);
  await save(config);

  log.info({ groupId, added }, 'Cities added to group');
  return added;
}

/**
 * Remove cities from a group's monitoring list.
 * Case-insensitive matching.
 */
export async function removeCities(
  groupId: string,
  cities: string[]
): Promise<string[]> {
  const config = configs.get(groupId);
  if (!config) return [];

  const toRemoveLower = new Set(cities.map((c) => c.trim().toLowerCase()));
  const removed: string[] = [];
  const remaining: string[] = [];

  for (const city of config.cities) {
    if (toRemoveLower.has(city.trim().toLowerCase())) {
      removed.push(city);
    } else {
      remaining.push(city);
    }
  }

  config.cities = remaining;
  configs.set(groupId, config);
  await save(config);

  log.info({ groupId, removed }, 'Cities removed from group');
  return removed;
}

/**
 * Clear all cities from a group (stop all monitoring).
 */
export async function clearCities(groupId: string): Promise<void> {
  const config = configs.get(groupId);
  if (!config) return;

  config.cities = [];
  configs.set(groupId, config);
  await save(config);

  log.info({ groupId }, 'All cities cleared from group');
}

/**
 * Set the message language for a group.
 */
export async function setLanguage(
  groupId: string,
  language: 'he' | 'en'
): Promise<void> {
  let config = configs.get(groupId);

  if (!config) {
    config = {
      groupId,
      groupName: '',
      cities: [],
      language,
      enabled: true,
      settings: {},
    };
  } else {
    config.language = language;
  }

  configs.set(groupId, config);
  await save(config);
  log.info({ groupId, language }, 'Language updated for group');
}

// =====================
// Activity Settings
// =====================

/**
 * Toggle shelter activity prompts appended to alert messages for a group.
 */
export async function setActivitiesEnabled(groupId: string, enabled: boolean): Promise<void> {
  const config = configs.get(groupId);
  if (!config) return;

  config.settings.activitiesEnabled = enabled;
  configs.set(groupId, config);
  await save(config);
  log.info({ groupId, enabled }, 'Activities updated');
}

// =====================
// Helpers
// =====================

/** Separator characters that indicate a city name boundary */
const SEPARATORS = [' - ', ' – ', '-', ' '];

/**
 * Smart city name matching.
 * Returns true if groupCity and alertCity refer to the same place.
 *
 * Rules:
 * - Exact match: "כרמל" == "כרמל" ✅
 * - Group is prefix: "ראש העין" matches "ראש העין - מזרח" ✅
 * - Alert is prefix: "ראש העין - מזרח" matches "ראש העין" ✅
 * - Substring in middle: "כרמל" does NOT match "טירת כרמל" ❌
 */
export function isCityMatch(groupCity: string, alertCity: string): boolean {
  // Exact match
  if (groupCity === alertCity) return true;

  // Group city is a prefix of alert city (e.g., "ראש העין" → "ראש העין - מזרח")
  if (alertCity.startsWith(groupCity)) {
    const rest = alertCity.substring(groupCity.length);
    // Must be followed by a separator, not just more characters
    if (SEPARATORS.some((sep) => rest.startsWith(sep))) return true;
  }

  // Alert city is a prefix of group city (e.g., "ראש העין - מזרח" alert, "ראש העין" group)
  if (groupCity.startsWith(alertCity)) {
    const rest = groupCity.substring(alertCity.length);
    if (SEPARATORS.some((sep) => rest.startsWith(sep))) return true;
  }

  return false;
}
