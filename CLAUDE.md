# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A WhatsApp bot that sends real-time shelter notifications for Israel using the RedAlert API. When Pikud HaOref fires a siren, the bot sends "go to shelter" messages to WhatsApp groups monitoring those cities, and "safe to leave" when the alert ends. The bot has a casual, friendly Hebrew tone (not military/formal).

## Commands

```bash
npm run dev          # Run locally with ts-node (needs .env file)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled output (production)
npx tsc --noEmit     # Type-check without emitting files
```

No test suite exists. Verify changes by type-checking (`npx tsc --noEmit`) and testing manually with `REDALERT_TEST_MODE=true` in `.env`.

## Deployment

- **Hosted on Railway** (auto-deploys on `git push` to master)
- **Repo**: `github.com/asaf5767/redalert-shelter-bot` (private)
- Railway builds via Dockerfile: installs deps → compiles TypeScript → copies `src/data/` to `dist/data/` → runs `node dist/index.js`
- Environment variables are set in Railway dashboard, not committed
- **Critical**: Only one instance can run at a time (WhatsApp allows one Baileys connection per session). Don't run locally while Railway is running.

## Architecture

Two persistent connections run 24/7:

1. **WhatsApp** (Baileys library via `services/whatsapp.ts`) — connected as phone number 972537142501. Sends/receives messages in groups.
2. **RedAlert** (Socket.IO via `services/redalert.ts`) — websocket to `redalert.orielhaim.com`. Receives real-time alert events pushed from Pikud HaOref.

### Alert Flow

```
RedAlert Socket.IO event → alert-router.ts → group-config.ts (city matching) → whatsapp.ts (send message)
```

The RedAlert API sends the **same alert through two Socket.IO paths simultaneously** (general `alert` event as an array + specific type events like `missiles`). The dedup system in `alert-router.ts` (60-second window + `activeShelters` map) prevents duplicate messages.

### Event Type Routing (in `alert-router.ts`)

| Event type | Behavior |
|---|---|
| `missiles`, `earthQuake`, `hostileAircraftIntrusion`, etc. | Shelter alert message with fun fact |
| `newsFlash` | Info message: "ייתכן שתהיה התרעה בדקות הקרובות" |
| `endAlert` | "נגמר! אפשר לצאת" (can arrive via both `alert` array and dedicated `endAlert` event) |
| `*Drill` | Silently ignored |

### City Matching (in `group-config.ts`)

Uses **prefix matching with separator boundary** — not substring matching. `ראש העין` matches `ראש העין - מזרח` but `כרמל` does NOT match `טירת כרמל`. The `isCityMatch()` function at the bottom of the file handles this.

### Alert Aggregation

When multiple alerts arrive in one Socket.IO event batch, all matching cities for a group are collected into **one message** (not one message per city).

### Group Approval System

Groups must be approved by an admin before the bot responds to commands. The `enabled` field in `group_city_config` controls this. `!approve` (admin-only) activates a group. Unapproved groups get a "this group isn't activated yet" message.

### Key Module Responsibilities

- `services/whatsapp.ts` — Baileys connection, QR code, reconnection with exponential backoff, message queue for disconnections
- `services/redalert.ts` — Socket.IO connection (production + test mode), event listeners
- `services/supabase.ts` — DB client, WhatsApp auth state persistence (replaces file-based auth), group config CRUD, alert logging
- `core/alert-router.ts` — Routes events to groups, dedup, active shelter tracking, aggregation
- `core/group-config.ts` — In-memory cache of group→cities mapping, synced to Supabase, city matching logic
- `core/command-handler.ts` — Chat commands (`!addcity`, `!search`, `!approve`, etc.)
- `core/city-database.ts` — 1,449 cities from Pikud HaOref loaded from `src/data/cities.json`, search and validation
- `utils/messages.ts` — All bot message templates (Hebrew + English), fun facts for shelter time

## Database (Supabase)

Three tables (shared Supabase instance with another project):

- `whatsapp_auth_state` — WhatsApp session/encryption keys (shared with Echo bot)
- `group_city_config` — Per-group city lists, language, enabled flag
- `alert_log` — History of all alerts sent

RLS is **disabled** on `group_city_config` and `alert_log`. The `whatsapp_auth_state` table predates this project.

## Bot Personality & Language

The bot uses casual, friendly Hebrew. Not formal, not military. Key tone words: "יאללה", "זזים", "נגמר!", "רגוע". Messages include random fun facts (Israel-related and weird science) during shelter alerts to lighten the mood. All messages are in `utils/messages.ts`.

WhatsApp uses **LID format** (`133088285880506@lid`) alongside phone numbers (`972526739276@s.whatsapp.net`) for sender identification. The admin check in `command-handler.ts` handles both formats. `ADMIN_NUMBERS` env var should include both the phone number and the LID.

## Known Gotchas

- **qrcode-terminal** has no TypeScript types — imported via `require()` not `import` in `whatsapp.ts`
- WhatsApp session is stored in Supabase, not local files. If deploying to a new environment, first run locally to scan QR, then deploy (session persists in DB).
- `src/data/cities.json` must be copied to `dist/data/` after build (handled by Railway build command and Dockerfile)
- The `cities.json` source is from `github.com/eladnava/pikud-haoref-api`. Run `node build-cities.js` to regenerate from `cities_raw.json`.
