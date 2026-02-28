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

import { GroupConfig, GroupConfigRow } from '../types';
import { loadGroupConfigs, saveGroupConfig } from '../services/supabase';
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
  // Load existing configs from database
  const rows = await loadGroupConfigs();

  for (const row of rows) {
    configs.set(row.group_id, {
      groupId: row.group_id,
      groupName: row.group_name || '',
      cities: row.cities || [],
      language: (row.language as 'he' | 'en') || 'he',
      enabled: row.enabled,
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
    // Uses substring matching: if user added "ראש העין", it matches
    // "ראש העין", "ראש העין - מזרח", "ראש העין - מערב", etc.
    const matched: string[] = [];
    for (const groupCity of config.cities) {
      const normalizedGroupCity = groupCity.trim().toLowerCase();
      for (let i = 0; i < normalizedAlertCities.length; i++) {
        const ac = normalizedAlertCities[i];
        // Match if alert city contains the group city OR group city contains alert city
        if (ac.includes(normalizedGroupCity) || normalizedGroupCity.includes(ac)) {
          // Use the original alert city name (preserves case/Hebrew)
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
    };
  } else {
    config.enabled = true;
  }

  configs.set(groupId, config);

  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: true,
  });

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
  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: config.enabled,
  });

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

  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: config.enabled,
  });

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

  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: config.enabled,
  });

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
    };
  } else {
    config.language = language;
  }

  configs.set(groupId, config);

  await saveGroupConfig({
    groupId: config.groupId,
    groupName: config.groupName,
    cities: config.cities,
    language: config.language,
    enabled: config.enabled,
  });

  log.info({ groupId, language }, 'Language updated for group');
}
