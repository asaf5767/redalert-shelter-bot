/**
 * TypeScript type definitions for the RedAlert Shelter Bot
 */

// =====================
// RedAlert API Types
// =====================

/** Alert object received from the RedAlert Socket.IO API */
export interface RedAlertEvent {
  /** Alert type: 'missiles', 'earthQuake', 'tsunami', etc. */
  type: string;
  /** Array of city names affected by this alert */
  cities: string[];
  /** Official safety instructions for the population */
  instructions: string;
}

/** All known alert types from the RedAlert API */
export type AlertType =
  | 'missiles'
  | 'radiologicalEvent'
  | 'earthQuake'
  | 'tsunami'
  | 'hostileAircraftIntrusion'
  | 'hazardousMaterials'
  | 'terroristInfiltration'
  | 'newsFlash'
  | 'endAlert'
  // Drill types
  | 'missilesDrill'
  | 'radiologicalEventDrill'
  | 'earthQuakeDrill'
  | 'tsunamiDrill'
  | 'hostileAircraftIntrusionDrill'
  | 'hazardousMaterialsDrill'
  | 'terroristInfiltrationDrill';

// =====================
// Group Configuration
// =====================

/** Per-group optional feature settings, stored in the settings JSONB column */
export interface GroupSettings {
  /** Whether to append a shelter activity to alert messages */
  activitiesEnabled?: boolean;
  /** Total cumulative milliseconds spent in shelter since bot joined */
  totalShelterTimeMs?: number;
  /** Whether to send daily Sefirat HaOmer reminders at 8pm Israel time */
  omerEnabled?: boolean;
}

/** Configuration for a single WhatsApp group's alert monitoring */
export interface GroupConfig {
  /** WhatsApp group JID, e.g. "120363419572967849@g.us" */
  groupId: string;
  /** Human-readable group name */
  groupName: string;
  /** List of city names to monitor alerts for */
  cities: string[];
  /** Message language: 'he' for Hebrew, 'en' for English */
  language: 'he' | 'en';
  /** Whether this group is actively receiving alerts */
  enabled: boolean;
  /** Optional feature toggles and streak state */
  settings: GroupSettings;
  /** ISO timestamp of when the bot first joined/was approved in this group */
  createdAt?: string;
}

// =====================
// Database Types
// =====================

/** Row in the alert_log Supabase table */
export interface AlertLogEntry {
  alertType: string;
  cities: string[];
  instructions: string;
  groupsNotified: string[];
  eventType: 'alert' | 'endAlert';
  rawData: any;
}

/** Row in the group_city_config Supabase table */
export interface GroupConfigRow {
  id?: string;
  group_id: string;
  group_name: string | null;
  cities: string[];
  language: string;
  enabled: boolean;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// =====================
// WhatsApp Types
// =====================

/** Callback when a WhatsApp text message is received */
export interface IncomingMessage {
  /** The group or chat ID */
  chatId: string;
  /** The sender's phone number / JID */
  senderJid: string;
  /** The sender's display name */
  senderName: string;
  /** The text content of the message */
  body: string;
  /** Whether it's a group message */
  isGroup: boolean;
  /** The raw message timestamp */
  timestamp: number;
  /** JIDs mentioned in the message (via @mention) */
  mentionedJids?: string[];
  /** If this is a reply, the JID of the original message author */
  quotedParticipant?: string;
  /** Raw message key (for reactions) */
  messageKey?: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
}

/** Callback type for processing incoming messages */
export type MessageHandler = (message: IncomingMessage) => Promise<void>;
