#!/usr/bin/env node

/**
 * Interactive Setup Wizard for RedAlert Shelter Bot
 *
 * Walks through configuration, writes .env, and checks
 * database tables via Supabase JS client.
 *
 * Zero external dependencies — uses Node built-in readline.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =====================
// Helpers
// =====================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function print(msg = '') {
  console.log(msg);
}

function success(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

function info(msg) {
  console.log(`  ℹ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
}

// =====================
// Database Verification
// =====================

/**
 * Check that all required tables exist in the Supabase database.
 * Guides the user to create them manually if any are missing
 * (Supabase JS client can't run DDL statements).
 */
async function verifyDatabaseSchema(supabase) {
  const tables = [
    { name: 'whatsapp_auth_state', column: 'key' },
    { name: 'group_city_config', column: 'group_id' },
    { name: 'alert_log', column: 'id' },
    { name: 'whatsapp_messages', column: 'id' },
  ];

  let allExist = true;
  const missing = [];

  for (const table of tables) {
    const { error } = await supabase.from(table.name).select(table.column).limit(1);
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      missing.push(table.name);
      allExist = false;
    } else if (error) {
      fail(`Error checking ${table.name}: ${error.message}`);
      return false;
    } else {
      success(`Table '${table.name}' exists`);
    }
  }

  if (allExist) {
    // Also check for the settings column on group_city_config
    const { error: settingsErr } = await supabase
      .from('group_city_config')
      .select('settings')
      .limit(1);
    if (settingsErr && (settingsErr.code === '42703' || settingsErr.message?.includes('settings'))) {
      warn("Table 'group_city_config' is missing the 'settings' column");
      info('Run this in Supabase SQL Editor:');
      info("  ALTER TABLE group_city_config ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';");
    }
    return true;
  }

  // Tables are missing — guide user to create them
  const schemaPath = path.join(__dirname, 'schema.sql');

  print();
  info(`Missing tables: ${missing.join(', ')}`);
  print();
  print('  ┌─────────────────────────────────────────────────────┐');
  print('  │  Please create the tables manually:                 │');
  print('  │                                                     │');
  print('  │  1. Open your Supabase dashboard                    │');
  print('  │  2. Go to SQL Editor                                │');
  print('  │  3. Paste the contents of setup/schema.sql          │');
  print('  │  4. Click "Run"                                     │');
  print('  │                                                     │');
  print(`  │  File: ${schemaPath}`);
  print('  └─────────────────────────────────────────────────────┘');
  print();

  return false;
}

// =====================
// Main Wizard
// =====================

async function main() {
  print();
  print('╔══════════════════════════════════════════════╗');
  print('║   🚀 RedAlert Shelter Bot — Setup Wizard    ║');
  print('╚══════════════════════════════════════════════╝');
  print();

  const envPath = path.join(__dirname, '..', '.env');

  // Check for existing .env
  if (fs.existsSync(envPath)) {
    const overwrite = await ask('  .env file already exists. Overwrite? (y/N)', 'N');
    if (overwrite.toLowerCase() !== 'y') {
      print();
      info('Keeping existing .env — exiting setup.');
      rl.close();
      return;
    }
    print();
  }

  const config = {};

  // ---- Step 1: Supabase ----
  print('━━━ Step 1/4: Database (Supabase) ━━━');
  print('  Recommended for production. Skip for local testing.');
  print('  Sign up free: https://supabase.com');
  print();

  config.SUPABASE_URL = await ask('  Supabase URL (Enter to skip)');
  if (config.SUPABASE_URL) {
    config.SUPABASE_KEY = await ask('  Supabase Key');

    if (config.SUPABASE_KEY) {
      // Test connection and check tables with a single client
      print();
      info('Testing Supabase connection...');
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
        const { error } = await supabase.from('whatsapp_auth_state').select('key').limit(1);
        // 42P01 = table doesn't exist (connection works, table missing — that's fine)
        if (error && error.code !== '42P01') {
          fail(`Connection error: ${error.message}`);
          warn('Double-check your URL and key.');
        } else {
          success('Connected to Supabase!');
        }

        // Check tables using the same client
        print();
        info('Checking database tables...');
        await verifyDatabaseSchema(supabase);
      } catch (err) {
        fail(`Could not connect: ${err.message}`);
        warn('Make sure npm install has been run.');
      }
    }
  } else {
    config.SUPABASE_KEY = '';
    print();
    info('Skipping Supabase — using file-based auth (auth_info/).');
    warn('WhatsApp session won\'t persist across container restarts.');
    warn('Group configs will only come from INITIAL_GROUPS env var.');
  }

  // ---- Step 2: RedAlert ----
  print();
  print('━━━ Step 2/4: RedAlert API ━━━');
  print('  Get an API key: https://redalert.orielhaim.com');
  print('  Or use test mode (simulated alerts, no key needed).');
  print();

  const mode = await ask('  Mode — test or prod? (test)', 'test');
  if (mode === 'prod' || mode === 'production') {
    config.REDALERT_TEST_MODE = 'false';
    config.REDALERT_API_KEY = await ask('  RedAlert API key');
    if (!config.REDALERT_API_KEY) {
      warn('No API key — switching to test mode.');
      config.REDALERT_TEST_MODE = 'true';
    }
  } else {
    config.REDALERT_TEST_MODE = 'true';
    config.REDALERT_API_KEY = '';
    success('Test mode enabled — simulated alerts every few seconds.');
  }

  // ---- Step 3: AI ----
  print();
  print('━━━ Step 3/4: AI Features (Optional) ━━━');
  print('  Enables Echo AI chat (!ask, "אקו", @mentions).');
  print('  Get a free key: https://console.groq.com');
  print();

  config.GROQ_API_KEY = await ask('  Groq API key (Enter to skip)');
  if (config.GROQ_API_KEY) {
    success('AI features enabled!');
  } else {
    info('AI features disabled — !ask and echo commands won\'t respond.');
  }

  // ---- Step 4: Admin ----
  print();
  print('━━━ Step 4/4: Admin Settings (Optional) ━━━');
  print('  Restrict admin commands to specific phone numbers.');
  print('  Leave empty to allow all group members.');
  print();

  config.ADMIN_NUMBERS = await ask('  Admin numbers, comma-separated (Enter to skip)');
  config.BOT_PHONE_NUMBER = await ask('  Bot phone number, e.g. 972501234567 (Enter to skip)');

  // ---- Write .env ----
  print();
  print('━━━ Writing Configuration ━━━');

  const envContent = [
    '# ===========================================',
    '# RedAlert Shelter Bot — Configuration',
    '# Generated by: npm run setup',
    '# ===========================================',
    '',
    '# --- Database (Recommended) ---',
    `SUPABASE_URL=${config.SUPABASE_URL || ''}`,
    `SUPABASE_KEY=${config.SUPABASE_KEY || ''}`,
    '',
    '# --- RedAlert API ---',
    `REDALERT_TEST_MODE=${config.REDALERT_TEST_MODE || 'false'}`,
    `REDALERT_API_KEY=${config.REDALERT_API_KEY || ''}`,
    '',
    '# Test mode settings (only when TEST_MODE=true)',
    'REDALERT_TEST_TIMING=5s',
    'REDALERT_TEST_CITIES=',
    'REDALERT_TEST_ALERTS=missiles',
    '',
    '# --- AI Features (Optional) ---',
    `GROQ_API_KEY=${config.GROQ_API_KEY || ''}`,
    '',
    '# --- Bot Settings ---',
    `BOT_PHONE_NUMBER=${config.BOT_PHONE_NUMBER || ''}`,
    'LOG_LEVEL=info',
    `ADMIN_NUMBERS=${config.ADMIN_NUMBERS || ''}`,
    '',
    '# --- Initial Groups (Optional) ---',
    '# JSON array for pre-configuring groups on first boot',
    '# Format: [{"groupId":"120363...@g.us","groupName":"Family","cities":["תל אביב"]}]',
    'INITIAL_GROUPS=',
    '',
  ].join('\n');

  fs.writeFileSync(envPath, envContent);
  success('.env file created');

  // ---- Summary ----
  print();
  print('╔══════════════════════════════════════════════╗');
  print('║   ✅ Setup Complete!                         ║');
  print('╚══════════════════════════════════════════════╝');
  print();
  print('  Configuration:');
  print(`    Supabase:   ${config.SUPABASE_URL ? '✓ Connected' : '✗ Skipped (file-based auth)'}`);
  print(`    RedAlert:   ${config.REDALERT_TEST_MODE === 'true' ? '🧪 Test mode' : '🔴 Production'}`);
  print(`    AI (Echo):  ${config.GROQ_API_KEY ? '✓ Enabled' : '✗ Disabled'}`);
  print(`    Admin:      ${config.ADMIN_NUMBERS ? '🔒 Restricted' : '🔓 Open to all'}`);
  print();
  print('  Next steps:');
  print('    1. npm run dev          Start the bot');
  print('    2. Scan the QR code     Link your WhatsApp');
  print('    3. !addcity תל אביב     Add cities in a group');
  print();
  print('  Useful commands:');
  print('    !help                   Show all bot commands');
  print('    !search ירושלים          Search city names');
  print('    !ask מה המצב?            Ask Echo AI (if enabled)');
  print();

  rl.close();
}

// =====================
// Run
// =====================

main().catch((err) => {
  console.error('Setup failed:', err.message);
  rl.close();
  process.exit(1);
});
