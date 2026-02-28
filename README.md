# RedAlert Shelter Bot

A WhatsApp bot that sends real-time shelter notifications based on the [RedAlert API](https://redalert.orielhaim.com) for Israel.

When an alert (siren) fires for cities your group is monitoring, the bot sends:
- **"Go to shelter"** message with alert details
- **"Safe to leave"** message when the alert ends

## Features

- Real-time alerts via RedAlert Socket.IO API
- Per-group city configuration
- Hebrew and English message support
- Chat commands for easy setup
- Deduplication (no spam if multiple alerts fire)
- Message queue for WhatsApp disconnections
- Supabase database for persistence
- Test mode for development

## Quick Start

### 1. Prerequisites

- **Node.js 18+** installed
- **Supabase** account (free tier works fine): https://supabase.com
- **RedAlert API key**: https://redalert.orielhaim.com
- **WhatsApp** account to link the bot to

### 2. Install

```bash
cd redalert-shelter-bot
npm install
```

### 3. Database Setup

Run this SQL in your Supabase SQL Editor to create the required tables:

```sql
-- WhatsApp session storage
CREATE TABLE whatsapp_auth_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-group city configuration
CREATE TABLE group_city_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL,
  group_name TEXT,
  cities TEXT[] NOT NULL DEFAULT '{}',
  language TEXT DEFAULT 'he',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Alert history log
CREATE TABLE alert_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  cities TEXT[] NOT NULL,
  instructions TEXT,
  groups_notified TEXT[],
  event_type TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Configure

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
REDALERT_API_KEY=your-redalert-api-key
```

### 5. Run

**Development (with test alerts):**
```bash
# Set REDALERT_TEST_MODE=true in .env first
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**With PM2 (recommended for production):**
```bash
npm run build
pm2 start ecosystem.config.js
```

### 6. Connect WhatsApp

When the bot starts, a QR code will appear in the terminal. Scan it with your WhatsApp:

1. Open WhatsApp on your phone
2. Go to **Settings** > **Linked Devices** > **Link a Device**
3. Scan the QR code

### 7. Add Cities

In any WhatsApp group where the bot is a member, send:

```
!addcity Tel Aviv, Haifa, Jerusalem
```

The bot will now send shelter alerts for those cities.

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!addcity` | Add cities to monitor | `!addcity תל אביב, חיפה` |
| `!removecity` | Remove cities | `!removecity חיפה` |
| `!cities` | List monitored cities | `!cities` |
| `!clearalerts` | Stop all monitoring | `!clearalerts` |
| `!lang` | Change language (he/en) | `!lang en` |
| `!status` | Show bot status | `!status` |
| `!test` | Send test message | `!test` |
| `!help` | Show all commands | `!help` |

## Test Mode

For development, set `REDALERT_TEST_MODE=true` in your `.env`. This connects to the RedAlert test server which generates simulated alerts every few seconds - no API key needed.

You can customize test behavior:
```bash
REDALERT_TEST_MODE=true
REDALERT_TEST_TIMING=10s          # Alert every 10 seconds
REDALERT_TEST_CITIES=Tel Aviv     # Only simulate for Tel Aviv
REDALERT_TEST_ALERTS=missiles     # Only missile alerts
```

## Architecture

```
src/
├── index.ts              # Entry point - boots everything
├── config.ts             # Environment configuration
├── types.ts              # TypeScript types
├── services/
│   ├── whatsapp.ts       # Baileys WhatsApp connection
│   ├── redalert.ts       # Socket.IO RedAlert connection
│   ├── supabase.ts       # Database operations
│   └── ai.ts             # Future AI integration placeholder
├── core/
│   ├── alert-router.ts   # Matches alerts to groups
│   ├── group-config.ts   # Per-group city management
│   └── command-handler.ts # Chat command processing
└── utils/
    ├── logger.ts         # Pino structured logging
    └── messages.ts       # Hebrew/English message templates
```

## How It Works

1. Bot connects to WhatsApp (via Baileys) and RedAlert (via Socket.IO)
2. RedAlert sends an `alert` event with `{ type, cities, instructions }`
3. Alert router finds which groups are monitoring the affected cities
4. Bot sends a "go to shelter" message to those groups
5. When RedAlert sends an `endAlert` event, bot sends "safe to leave"

## License

MIT
