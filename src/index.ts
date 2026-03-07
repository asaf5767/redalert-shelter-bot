/**
 * RedAlert Shelter Bot - Main Entry Point
 *
 * A WhatsApp bot that sends real-time shelter notifications
 * based on the RedAlert API for Israel.
 *
 * Boot sequence:
 * 1. Validate configuration
 * 2. Initialize Supabase (database)
 * 3. Load group city configs from database
 * 4. Connect to WhatsApp (with QR code if needed)
 * 5. Connect to RedAlert Socket.IO
 * 6. Start listening for alerts and commands
 */

import { validateConfig } from './config';
import { initSupabase } from './services/supabase';
import { connectToWhatsApp } from './services/whatsapp';
import { connectToRedAlert, disconnectRedAlert } from './services/redalert';
import * as groupConfig from './core/group-config';
import { handleAlert, handleEndAlert } from './core/alert-router';
import { handleMessage, handleGroupJoin } from './core/command-handler';
import { createLogger } from './utils/logger';

const log = createLogger('main');

// =====================
// Main Boot Sequence
// =====================

async function main(): Promise<void> {
  console.log('');
  console.log('==========================================');
  console.log('   RedAlert Shelter Bot');
  console.log('   Real-time shelter notifications');
  console.log('==========================================');
  console.log('');

  // Step 1: Validate config
  const { valid, errors } = validateConfig();
  if (!valid) {
    console.error('Configuration errors:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('\nPlease check your .env file. See .env.example for reference.');
    process.exit(1);
  }

  // Step 2: Initialize database (optional — bot works without it)
  initSupabase();

  // Step 3: Load group configs
  log.info('Loading group configurations...');
  await groupConfig.init();

  const configs = groupConfig.getAllConfigs();
  if (configs.length > 0) {
    log.info(
      { groups: configs.map((c) => ({ name: c.groupName, cities: c.cities.length })) },
      'Loaded %d group configs',
      configs.length
    );
  } else {
    log.info('No group configs found. Use !addcity in a group to start monitoring.');
  }

  // Step 4: Connect to WhatsApp
  log.info('Connecting to WhatsApp...');

  await connectToWhatsApp(
    // onConnected callback
    () => {
      log.info('WhatsApp is ready!');

      // Step 5: Connect to RedAlert (only after WhatsApp is ready)
      log.info('Connecting to RedAlert...');
      connectToRedAlert(
        // onAlert callback
        (alerts) => {
          handleAlert(alerts).catch((err) => {
            log.error({ err }, 'Unhandled error in alert handler');
          });
        },
        // onEndAlert callback
        (alert) => {
          handleEndAlert(alert).catch((err) => {
            log.error({ err }, 'Unhandled error in endAlert handler');
          });
        }
      );

      console.log('');
      console.log('==========================================');
      console.log('   Bot is running!');
      console.log('   Listening for alerts...');
      console.log('==========================================');
      console.log('');
    },
    // onMessage callback (for chat commands)
    handleMessage,
    // onGroupJoin callback (send welcome when bot is added to a group)
    handleGroupJoin
  );
}

// =====================
// Graceful Shutdown
// =====================

function shutdown(signal: string): void {
  log.info({ signal }, 'Shutting down...');

  disconnectRedAlert();

  // Give a moment for cleanup
  setTimeout(() => {
    log.info('Goodbye!');
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors (don't crash the bot)
process.on('uncaughtException', (err) => {
  log.error({ err }, 'Uncaught exception');
});

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled promise rejection');
});

// =====================
// Start!
// =====================

main().catch((err) => {
  log.error({ err }, 'Fatal error during startup');
  console.error('Fatal error:', err);
  process.exit(1);
});

// --- Future: AI Service ---
// Import and initialize an LLM service here (e.g., Groq, OpenAI, Anthropic)
// to add smart features like:
// - Natural language city configuration ("monitor alerts for my area")
// - Alert context/analysis ("how long do alerts typically last for this area?")
// - Personalized safety instructions
// See src/services/ for the pattern to add new service integrations
