/**
 * Supabase Service - database client, auth state, and data operations
 *
 * Handles:
 * - Supabase client initialization
 * - WhatsApp session credential storage (replaces file-based auth)
 * - Group config CRUD operations
 * - Alert logging
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from '@whiskeysockets/baileys';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';
import { GroupConfigRow, AlertLogEntry } from '../types';
import { createLogger } from '../utils/logger';

const log = createLogger('supabase');

// Table names
const AUTH_TABLE = 'whatsapp_auth_state';
const GROUP_CONFIG_TABLE = 'group_city_config';
const ALERT_LOG_TABLE = 'alert_log';

// Singleton Supabase client
let supabase: SupabaseClient | null = null;

// =====================
// Client Initialization
// =====================

/**
 * Initialize the Supabase client.
 * Must be called before any database operations.
 */
export function initSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  log.info('Supabase client initialized');
  return supabase;
}

/** Get the Supabase client (must call initSupabase first) */
export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

// =====================
// Auth State (WhatsApp Session)
// =====================

/**
 * Read a value from the auth state table
 */
async function readAuthData(key: string): Promise<any | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(AUTH_TABLE)
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return JSON.parse(data.value, BufferJSON.reviver);
  } catch (err) {
    log.error({ err, key }, 'Error reading auth data');
    return null;
  }
}

/**
 * Write a value to the auth state table
 */
async function writeAuthData(key: string, value: any): Promise<void> {
  if (!supabase) return;

  try {
    const serialized = JSON.stringify(value, BufferJSON.replacer);
    const { error } = await supabase
      .from(AUTH_TABLE)
      .upsert(
        { key, value: serialized, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      log.error({ error, key }, 'Error writing auth data');
    }
  } catch (err) {
    log.error({ err, key }, 'Error writing auth data');
  }
}

/**
 * Delete a value from the auth state table
 */
async function removeAuthData(key: string): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from(AUTH_TABLE).delete().eq('key', key);
    if (error) {
      log.error({ error, key }, 'Error deleting auth data');
    }
  } catch (err) {
    log.error({ err, key }, 'Error deleting auth data');
  }
}

/**
 * Supabase-backed auth state for Baileys.
 * Drop-in replacement for useMultiFileAuthState - stores WhatsApp
 * session credentials in the database instead of local files.
 *
 * This is more reliable across restarts and server migrations.
 */
export async function useSupabaseAuthState(): Promise<{
  state: { creds: AuthenticationCreds; keys: any };
  saveCreds: () => Promise<void>;
} | null> {
  if (!supabase) {
    log.error('Supabase client not initialized');
    return null;
  }

  // Verify the auth table exists
  const { error: tableCheck } = await supabase
    .from(AUTH_TABLE)
    .select('key')
    .limit(1);

  if (tableCheck && tableCheck.code === '42P01') {
    log.error(
      'Auth table does not exist. Please create it - see README for SQL.'
    );
    return null;
  }

  log.info('Using Supabase-backed WhatsApp auth state');

  // Load existing credentials or create new ones
  let creds = await readAuthData('creds');
  if (!creds) {
    log.info('No existing WhatsApp credentials - will need QR scan');
    creds = initAuthCreds();
    await writeAuthData('creds', creds);
  } else {
    log.info('Loaded existing WhatsApp credentials from database');
  }

  // Signal protocol key store (used by Baileys for encryption)
  const keys = {
    get: async <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[]
    ): Promise<{ [key: string]: SignalDataTypeMap[T] }> => {
      const result: { [key: string]: SignalDataTypeMap[T] } = {};
      for (const id of ids) {
        const data = await readAuthData(`${type}-${id}`);
        if (data) result[id] = data;
      }
      return result;
    },

    set: async (data: any): Promise<void> => {
      const tasks: Promise<void>[] = [];
      for (const category in data) {
        for (const id in data[category]) {
          const value = data[category][id];
          const key = `${category}-${id}`;
          if (value) {
            tasks.push(writeAuthData(key, value));
          } else {
            tasks.push(removeAuthData(key));
          }
        }
      }
      await Promise.all(tasks);
    },
  };

  const saveCreds = async (): Promise<void> => {
    await writeAuthData('creds', creds);
  };

  return { state: { creds, keys }, saveCreds };
}

// =====================
// Group Config Operations
// =====================

/**
 * Load all group configurations from the database.
 * Loads ALL groups (including unapproved) so the command handler
 * can check approval status. Alert routing checks enabled flag separately.
 */
export async function loadGroupConfigs(): Promise<GroupConfigRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from(GROUP_CONFIG_TABLE)
      .select('*');

    if (error) {
      // Table might not exist yet - that's OK on first boot
      if (error.code === '42P01') {
        log.warn('group_city_config table does not exist yet');
        return [];
      }
      log.error({ error }, 'Error loading group configs');
      return [];
    }

    return data || [];
  } catch (err) {
    log.error({ err }, 'Error loading group configs');
    return [];
  }
}

/**
 * Save (upsert) a group's city configuration to the database.
 */
export async function saveGroupConfig(config: {
  groupId: string;
  groupName: string | null;
  cities: string[];
  language?: string;
  enabled?: boolean;
}): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from(GROUP_CONFIG_TABLE).upsert(
      {
        group_id: config.groupId,
        group_name: config.groupName,
        cities: config.cities,
        language: config.language || 'he',
        enabled: config.enabled !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'group_id' }
    );

    if (error) {
      log.error({ error, groupId: config.groupId }, 'Error saving group config');
      return false;
    }

    return true;
  } catch (err) {
    log.error({ err, groupId: config.groupId }, 'Error saving group config');
    return false;
  }
}

// =====================
// Alert Logging
// =====================

/**
 * Log an alert event to the database for history and debugging.
 */
export async function logAlert(entry: AlertLogEntry): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from(ALERT_LOG_TABLE).insert({
      alert_type: entry.alertType,
      cities: entry.cities,
      instructions: entry.instructions,
      groups_notified: entry.groupsNotified,
      event_type: entry.eventType,
      raw_data: entry.rawData,
    });

    if (error) {
      // Table might not exist yet - log but don't crash
      if (error.code === '42P01') {
        log.warn('alert_log table does not exist - skipping log');
        return;
      }
      log.error({ error }, 'Error logging alert');
    }
  } catch (err) {
    log.error({ err }, 'Error logging alert');
  }
}
