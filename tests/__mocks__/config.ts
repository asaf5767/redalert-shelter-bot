/** Stub config module — no process.env or dotenv needed in tests */
export const SUPABASE_URL = '';
export const SUPABASE_KEY = '';
export const REDALERT_API_KEY = '';
export const REDALERT_TEST_MODE = false;
export const REDALERT_TEST_TIMING = '5s';
export const REDALERT_TEST_CITIES = '';
export const REDALERT_TEST_ALERTS = 'missiles';
export const REDALERT_SERVER = 'https://redalert.orielhaim.com';
export const GROQ_API_KEY = '';
export const GEMINI_API_KEY = '';
export const BOT_PHONE_NUMBER = '972501234567';
export const LOG_LEVEL = 'silent';
export const ADMIN_NUMBERS: Set<string> = new Set(['972509999999']);
export const getInitialGroups = () => [];
export const isSupabaseConfigured = () => false;
export const validateConfig = () => ({ valid: true, errors: [] });
