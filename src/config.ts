/**
 * Configuration - loads and validates environment variables
 *
 * All config is loaded from .env file via dotenv.
 * See .env.example for all available settings.
 */

import 'dotenv/config';

// =====================
// Required Config
// =====================

/** Supabase database URL */
export const SUPABASE_URL = process.env.SUPABASE_URL || '';

/** Supabase anonymous key */
export const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// =====================
// RedAlert Config
// =====================

/** API key for the RedAlert production server */
export const REDALERT_API_KEY = process.env.REDALERT_API_KEY || '';

/** Whether to use the test server (no API key needed) */
export const REDALERT_TEST_MODE = process.env.REDALERT_TEST_MODE === 'true';

/** Test server: how often to generate alerts (e.g., "5s", "1m") */
export const REDALERT_TEST_TIMING = process.env.REDALERT_TEST_TIMING || '5s';

/** Test server: which cities to simulate (comma-separated) */
export const REDALERT_TEST_CITIES = process.env.REDALERT_TEST_CITIES || '';

/** Test server: which alert types to simulate (comma-separated) */
export const REDALERT_TEST_ALERTS = process.env.REDALERT_TEST_ALERTS || 'missiles';

/** RedAlert server base URL */
export const REDALERT_SERVER = 'https://redalert.orielhaim.com';

// =====================
// AI Config
// =====================

/** Groq API key (enables Echo AI chat) */
export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

/** Google Gemini API key (legacy, kept for fallback) */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// =====================
// Bot Config
// =====================

/** Bot's phone number (without +), for identification */
export const BOT_PHONE_NUMBER = process.env.BOT_PHONE_NUMBER || '';

/** Logging level for pino */
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/** Admin phone numbers that can use admin commands (comma-separated) */
export const ADMIN_NUMBERS: Set<string> = new Set(
  (process.env.ADMIN_NUMBERS || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
);

// =====================
// Initial Group Config
// =====================

/** Parse INITIAL_GROUPS from env - used on first boot only */
export function getInitialGroups(): Array<{
  groupId: string;
  groupName: string;
  cities: string[];
}> {
  const raw = process.env.INITIAL_GROUPS;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('[CONFIG] Failed to parse INITIAL_GROUPS JSON');
    return [];
  }
}

// =====================
// Helpers
// =====================

/** Whether Supabase is configured (has URL + key) */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

// =====================
// Validation
// =====================

/** Check that required config is present */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!REDALERT_TEST_MODE && !REDALERT_API_KEY) {
    errors.push('REDALERT_API_KEY is required (or set REDALERT_TEST_MODE=true)');
  }

  return { valid: errors.length === 0, errors };
}
