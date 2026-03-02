-- ===========================================
-- RedAlert Shelter Bot — Database Schema
-- ===========================================
-- Run this in your Supabase SQL Editor, or use: npm run setup
-- All statements are idempotent (safe to run multiple times).

-- 1. WhatsApp session storage
-- Stores Baileys encryption keys so the bot reconnects without QR scan.
CREATE TABLE IF NOT EXISTS whatsapp_auth_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Per-group city configuration
-- Each WhatsApp group has its own list of monitored cities.
CREATE TABLE IF NOT EXISTS group_city_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL,
  group_name TEXT,
  cities TEXT[] NOT NULL DEFAULT '{}',
  language TEXT DEFAULT 'he',
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id)
);

-- 3. Alert history log
-- Every alert sent is recorded for debugging and analytics.
CREATE TABLE IF NOT EXISTS alert_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  cities TEXT[] NOT NULL,
  instructions TEXT,
  groups_notified TEXT[],
  event_type TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Message history (for AI conversation context)
-- Stores recent messages so Echo AI can maintain conversation context.
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  chat_name TEXT,
  sender_name TEXT,
  sender_number TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  body TEXT,
  timestamp BIGINT NOT NULL,
  from_me BOOLEAN DEFAULT false,
  is_group BOOLEAN DEFAULT false,
  is_content BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alert_log_created ON alert_log(created_at DESC);
