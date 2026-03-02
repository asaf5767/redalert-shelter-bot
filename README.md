# 🚨 RedAlert Shelter Bot

A WhatsApp bot that sends **real-time shelter notifications** based on Israel's [RedAlert API](https://redalert.orielhaim.com). When Pikud HaOref fires a siren, groups get a "go to shelter" message. When it's over — "safe to come out."

Built with [Baileys](https://github.com/WhiskeySockets/Baileys) (WhatsApp Web) + [Socket.IO](https://socket.io/) (RedAlert) + [Supabase](https://supabase.com) (database, optional).

## Features

**Core Alerts**
- Real-time alerts via RedAlert Socket.IO websocket
- Per-group city configuration (1,449 cities from Pikud HaOref)
- Hebrew and English message support
- Smart deduplication — no spam from parallel alert events
- Message queue for WhatsApp disconnections
- Shelter duration wrap-up ("~3 דקות בממ"ד — כולם בחוץ?")

**AI Chat (Echo)** — *optional, powered by Groq*
- `!ask` / `!ai` — ask the bot anything
- Say "אקו" or "echo" anywhere in a message
- @mention or reply to the bot
- DM the bot directly (no command needed)
- Remembers recent conversation context per group

**Engagement**
- **Streak tracker** — celebrates hours of silence between alerts (6h → 12h → 24h → week)
- **Shelter activities** — 26 mini-challenges to pass the time during alerts

## Quick Start

### Option A: Minimal (zero external accounts)

```bash
git clone https://github.com/asaf5767/redalert-shelter-bot.git
cd redalert-shelter-bot
npm install
npm run setup    # interactive wizard — just press Enter to skip Supabase
npm run dev      # starts in test mode with simulated alerts
```

Scan the QR code with WhatsApp → bot is running. That's it.

> **Note:** Without Supabase, the WhatsApp session is stored locally in `auth_info/`. It won't persist across container restarts, but works fine for local development.

### Option B: Full Setup (production)

```bash
git clone https://github.com/asaf5767/redalert-shelter-bot.git
cd redalert-shelter-bot
npm install
npm run setup    # walks you through Supabase, API key, AI, admin
npm run dev      # or: npm run build && npm start
```

The setup wizard will:
1. Connect to your Supabase project and check database tables
2. Configure RedAlert (test mode or production API key)
3. Optionally enable AI features (Groq)
4. Optionally set admin phone numbers
5. Write your `.env` file

### Manual Setup

If you prefer to configure manually:

```bash
cp .env.example .env
# Edit .env with your values, then:
npm run dev
```

For the database, run `setup/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard).

## Commands

### Alert Management

| Command | Description | Example |
|---------|-------------|---------|
| `!addcity` | Add cities to monitor | `!addcity תל אביב, חיפה` |
| `!removecity` | Remove cities | `!removecity חיפה` |
| `!cities` | List monitored cities | `!cities` |
| `!clearalerts` | Stop all monitoring | `!clearalerts` |
| `!search` | Search 1,449 city names | `!search ראש` |
| `!lang` | Change language (he/en) | `!lang en` |

### Info & Testing

| Command | Description | Example |
|---------|-------------|---------|
| `!status` | Show bot status | `!status` |
| `!test` | Send test alert | `!test` |
| `!help` | Show all commands | `!help` |

### AI Chat (Echo)

| Trigger | How | Example |
|---------|-----|---------|
| `!ask` or `!ai` | Command | `!ask כמה זמן בממ"ד?` |
| `אקו` or `echo` | Keyword in message | `אקו מה קורה?` |
| @mention | Tag the bot | `@RedAlert מה מזג האוויר?` |
| Reply | Reply to any bot message | *(just type your question)* |
| DM | Send any message in private chat | *(no command needed)* |

> Requires `GROQ_API_KEY` in `.env`. Get one free at [console.groq.com](https://console.groq.com).

### Engagement Features

| Command | Description | Default |
|---------|-------------|---------|
| `!streak on/off` | Silence streak milestones (6h, 12h, 24h…) | On |
| `!activities on/off` | Mini-challenges during alerts | On |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Recommended | Supabase project URL |
| `SUPABASE_KEY` | Recommended | Supabase anon/public key |
| `REDALERT_API_KEY` | For production | API key from [redalert.orielhaim.com](https://redalert.orielhaim.com) |
| `REDALERT_TEST_MODE` | — | Set `true` for simulated alerts (no API key needed) |
| `GROQ_API_KEY` | For AI features | Free key from [console.groq.com](https://console.groq.com) |
| `ADMIN_NUMBERS` | Optional | Comma-separated phone numbers for admin commands |
| `BOT_PHONE_NUMBER` | Optional | Bot's phone number (for identification) |
| `LOG_LEVEL` | Optional | `debug`, `info`, `warn`, `error` (default: `info`) |
| `INITIAL_GROUPS` | Optional | JSON array of groups to pre-configure on first boot |

**Test mode extras** (only when `REDALERT_TEST_MODE=true`):

| Variable | Default | Description |
|----------|---------|-------------|
| `REDALERT_TEST_TIMING` | `5s` | Alert frequency |
| `REDALERT_TEST_CITIES` | *(all)* | Comma-separated cities to simulate |
| `REDALERT_TEST_ALERTS` | `missiles` | Alert types to simulate |

## Deployment

### Railway (recommended for production)

The repo includes `railway.toml` and `Dockerfile` for one-click deployment:

1. Push to GitHub
2. Connect the repo in [Railway](https://railway.app)
3. Add environment variables in the Railway dashboard
4. Auto-deploys on every push to master

> **Important:** Only one instance can run at a time (WhatsApp/Baileys limitation).

### Docker

```bash
docker build -t redalert-bot .
docker run -d --env-file .env redalert-bot
```

### PM2 (VPS / bare metal)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

## Architecture

```
src/
├── index.ts                # Entry point — boot sequence
├── config.ts               # Environment variable loading + validation
├── types.ts                # TypeScript type definitions
├── services/
│   ├── whatsapp.ts         # Baileys connection, QR, reconnection, message queue
│   ├── redalert.ts         # Socket.IO connection to RedAlert API
│   ├── supabase.ts         # Database operations (optional)
│   └── ai.ts               # Groq/Gemini AI integration
├── core/
│   ├── alert-router.ts     # Routes alerts → groups, dedup, shelter tracking
│   ├── group-config.ts     # Per-group city config (in-memory + DB sync)
│   ├── command-handler.ts  # Chat command processing
│   ├── city-database.ts    # 1,449 cities from Pikud HaOref
│   └── streak-tracker.ts   # Silence streak milestones
├── utils/
│   ├── logger.ts           # Pino structured logging
│   └── messages.ts         # All message templates (Hebrew + English)
└── data/
    └── cities.json         # City database (generated from cities_raw.json)

setup/
├── setup.js                # Interactive setup wizard
└── schema.sql              # Complete database schema
```

### How It Works

```
RedAlert Socket.IO event
  → alert-router.ts (dedup, shelter tracking)
    → group-config.ts (city matching — prefix-based, not substring)
      → whatsapp.ts (send message to group)
```

1. Bot connects to WhatsApp (Baileys) and RedAlert (Socket.IO) simultaneously
2. RedAlert pushes alert events with `{ type, cities, instructions }`
3. Alert router finds which groups monitor the affected cities
4. Bot sends "go to shelter" + optional activity challenge
5. When `endAlert` fires → "safe to come out" + shelter duration

## Database Schema

If using Supabase, run `setup/schema.sql` in the SQL Editor. Four tables:

- `whatsapp_auth_state` — WhatsApp session/encryption keys
- `group_city_config` — Per-group city lists, language, enabled flag, feature settings
- `alert_log` — History of all alerts sent
- `whatsapp_messages` — Message history for AI conversation context

See [`setup/schema.sql`](setup/schema.sql) for the complete schema.

## Credits

- **RedAlert API** — [redalert.orielhaim.com](https://redalert.orielhaim.com) by Oriel Haim
- **City database** — [eladnava/pikud-haoref-api](https://github.com/eladnava/pikud-haoref-api)
- **WhatsApp library** — [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)
- **AI** — [Groq](https://groq.com) (Llama 3.3 70B)

## License

[MIT](LICENSE)
