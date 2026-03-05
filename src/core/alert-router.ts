/**
 * Alert Router - matches RedAlert events to WhatsApp groups
 *
 * Core logic:
 * 1. Receives alerts from the RedAlert service
 * 2. Finds which groups are monitoring the affected cities
 * 3. Sends shelter notifications via WhatsApp
 * 4. Tracks active shelters to handle endAlert correctly
 *
 * Deduplication:
 * - Tracks which cities each group is currently "in shelter" for
 * - Avoids sending duplicate "go to shelter" if already sheltering
 * - Sends "safe to leave" only when ALL active cities clear for a group
 */

import { RedAlertEvent, GroupConfig } from '../types';
import * as groupConfig from './group-config';
import { sendGroupMessage } from '../services/whatsapp';
import { logAlert, getShelterVisitCount } from '../services/supabase';
import {
  buildAlertMessage,
  buildActivityMessage,
  buildEndAlertMessage,
  buildNewsFlashMessage,
} from '../utils/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('alert-router');

/**
 * Active shelter state: tracks which cities each group is currently sheltering for.
 * Key: groupId, Value: Set of city names currently under alert
 */
const activeShelters = new Map<string, Set<string>>();

/**
 * Tracks when each group entered shelter (timestamp ms of the first alert).
 * Used to compute duration for the wrap-up message after all-clear.
 * Key: groupId, Value: Date.now() when the first alert was sent
 */
const shelterStartTimes = new Map<string, number>();

/**
 * Dedup: track recently sent messages to prevent duplicates.
 * Key: "groupId:eventType:cities_sorted", Value: timestamp of last send
 * Messages within DEDUP_WINDOW_MS of each other are considered duplicates.
 */
const recentMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000; // 60 seconds

/**
 * Per-group newsFlash cooldown: prevents spamming a group with multiple
 * newsFlash messages when overlapping city combos produce different dedup keys.
 * Key: groupId, Value: timestamp of last newsFlash sent to that group
 */
const lastNewsFlashPerGroup = new Map<string, number>();
const NEWS_FLASH_COOLDOWN_MS = 180_000; // 3 minutes

/**
 * Check if a message was recently sent (within dedup window).
 * If not, mark it as sent and return false (not a duplicate).
 */
function isDuplicate(groupId: string, eventType: string, cities: string[]): boolean {
  const key = `${groupId}:${eventType}:${[...cities].sort().join(',')}`;
  const now = Date.now();
  const lastSent = recentMessages.get(key);

  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    log.debug({ key, ago: now - lastSent }, 'Duplicate message suppressed');
    return true;
  }

  recentMessages.set(key, now);

  // Clean up old entries every so often
  if (recentMessages.size > 200) {
    for (const [k, t] of recentMessages) {
      if (now - t > DEDUP_WINDOW_MS) recentMessages.delete(k);
    }
  }

  return false;
}

// =====================
// Alert Handlers
// =====================

/**
 * Handle incoming alerts from RedAlert.
 *
 * For each alert:
 * 1. Find groups monitoring any of the alert's cities
 * 2. Determine which cities are NEW (not already in shelter)
 * 3. Send "go to shelter" message for new cities only
 * 4. Update the active shelter tracking
 * 5. Log the alert to the database
 */
export async function handleAlert(alerts: RedAlertEvent[]): Promise<void> {
  // Aggregate: collect all new cities per group across all alerts in this batch
  // Key: groupId, Value: { config, newCities, alertType, wasAlreadySheltering }
  const groupBatch = new Map<
    string,
    { config: GroupConfig; newCities: string[]; alertType: string; wasAlreadySheltering: boolean }
  >();

  for (const alert of alerts) {
    log.info(
      { type: alert.type, cities: alert.cities },
      'Processing alert'
    );

    // newsFlash = heads-up warning, not a siren. Send info message, not shelter alert.
    if (alert.type === 'newsFlash') {
      await handleNewsFlash(alert);
      continue;
    }

    // endAlert coming through the general alert event - handle as end, not shelter
    if (alert.type === 'endAlert') {
      await handleEndAlert(alert);
      continue;
    }

    // Skip drill alerts (don't send shelter messages for drills)
    if (alert.type.endsWith('Drill')) {
      log.info({ type: alert.type }, 'Skipping drill alert');
      continue;
    }

    // Find groups that care about these cities
    const matchingGroups = groupConfig.getMatchingGroups(alert.cities);

    if (matchingGroups.length === 0) {
      log.debug(
        { cities: alert.cities },
        'No groups monitoring these cities'
      );
      continue;
    }

    for (const { config, matchedCities } of matchingGroups) {
      // Get or create the shelter set for this group
      let shelter = activeShelters.get(config.groupId);
      if (!shelter) {
        shelter = new Set<string>();
        activeShelters.set(config.groupId, shelter);
      }

      // Find cities that are NEW to this group's shelter
      const newCities = matchedCities.filter(
        (city) => !shelter!.has(city.toLowerCase())
      );

      if (newCities.length === 0) continue;

      // Add new cities to active shelter tracking
      for (const city of newCities) {
        shelter.add(city.toLowerCase());
      }

      // Aggregate into the batch for this group
      const existing = groupBatch.get(config.groupId);
      if (existing) {
        // Add new cities that aren't already in the batch
        for (const city of newCities) {
          if (!existing.newCities.includes(city)) {
            existing.newCities.push(city);
          }
        }
      } else {
        // Snapshot: was this group already in shelter before this batch?
        // If shelterStartTimes already has an entry, this is a follow-up, not a new session.
        const wasAlreadySheltering = shelterStartTimes.has(config.groupId);
        groupBatch.set(config.groupId, {
          config,
          newCities: [...newCities],
          alertType: alert.type,
          wasAlreadySheltering,
        });
      }
    }
  }

  // Now send one message per group with all aggregated cities
  const groupsNotified: string[] = [];

  for (const [groupId, { config, newCities, alertType, wasAlreadySheltering }] of groupBatch) {
    const fakeAlert: RedAlertEvent = {
      type: alertType,
      cities: newCities,
      instructions: '',
    };

    // Record shelter start time (only on the first alert — don't overwrite on follow-ups)
    if (!shelterStartTimes.has(groupId)) {
      shelterStartTimes.set(groupId, Date.now());
    }

    const message = buildAlertMessage(fakeAlert, newCities, config.language);

    log.info(
      { groupId, groupName: config.groupName, newCities },
      'Sending aggregated shelter alert to group'
    );

    await sendGroupMessage(groupId, message);
    groupsNotified.push(groupId);

    // Follow-up activity message: only on NEW shelter session (not follow-up alerts)
    // Default on — only skip if explicitly disabled or group was already sheltering
    if (config.settings?.activitiesEnabled !== false && !wasAlreadySheltering) {
      await sendGroupMessage(groupId, buildActivityMessage(config.language));
    }
  }

  // Log once
  if (groupsNotified.length > 0) {
    const allCities = [...new Set(alerts.flatMap((a) => a.cities))];
    await logAlert({
      alertType: alerts[0]?.type || 'unknown',
      cities: allCities,
      instructions: alerts[0]?.instructions || '',
      groupsNotified,
      eventType: 'alert',
      rawData: alerts,
    });
  }
}

/**
 * Handle newsFlash events - a heads-up that an alert may come soon.
 * Sends an informational message (not a shelter alert).
 */
async function handleNewsFlash(alert: RedAlertEvent): Promise<void> {
  const matchingGroups = groupConfig.getMatchingGroups(alert.cities);
  if (matchingGroups.length === 0) return;

  const groupsNotified: string[] = [];

  for (const { config, matchedCities } of matchingGroups) {
    // Per-group cooldown: skip if we sent ANY newsFlash to this group recently
    const lastSent = lastNewsFlashPerGroup.get(config.groupId);
    const now = Date.now();
    if (lastSent && now - lastSent < NEWS_FLASH_COOLDOWN_MS) {
      log.debug(
        { groupId: config.groupId, ago: now - lastSent },
        'newsFlash cooldown active, skipping'
      );
      continue;
    }

    // Dedup: skip if we already sent a newsFlash for these exact cities recently
    if (isDuplicate(config.groupId, 'newsFlash', matchedCities)) continue;

    const message = buildNewsFlashMessage(matchedCities, config.language);

    log.info(
      { groupId: config.groupId, matchedCities },
      'Sending newsFlash to group'
    );

    await sendGroupMessage(config.groupId, message);
    lastNewsFlashPerGroup.set(config.groupId, now);
    groupsNotified.push(config.groupId);
  }

  if (groupsNotified.length > 0) {
    await logAlert({
      alertType: 'newsFlash',
      cities: alert.cities,
      instructions: alert.instructions,
      groupsNotified,
      eventType: 'alert',
      rawData: alert,
    });
  }
}

/**
 * Handle end-of-alert events from RedAlert.
 *
 * For each affected group:
 * 1. Remove the cleared cities from active shelter tracking
 * 2. If the group has NO more active cities → send "safe to leave"
 * 3. If the group still has other active cities → send partial update
 */
export async function handleEndAlert(alert: RedAlertEvent): Promise<void> {
  log.info(
    { type: alert.type, cities: alert.cities },
    'Processing endAlert'
  );

  const groupsNotified: string[] = [];

  // Check each group that has active shelters
  for (const [groupId, shelter] of activeShelters.entries()) {
    // Find which of this group's active cities are being cleared
    const clearedCities: string[] = [];

    for (const city of alert.cities) {
      if (shelter.has(city.toLowerCase())) {
        shelter.delete(city.toLowerCase());
        clearedCities.push(city);
      }
    }

    if (clearedCities.length === 0) continue;

    // Dedup: skip if we already sent an endAlert for these cities recently
    if (isDuplicate(groupId, 'endAlert', clearedCities)) continue;

    // Get the group's config for language preference
    const config = groupConfig.getGroupConfig(groupId);
    const language = config?.language || 'he';

    // Compute duration and visit count if this ends the shelter session
    let durationMs: number | undefined;
    let visitCount: number | undefined;
    if (shelter.size === 0) {
      activeShelters.delete(groupId);
      const startTime = shelterStartTimes.get(groupId);
      if (startTime) {
        durationMs = Date.now() - startTime;
        shelterStartTimes.delete(groupId);
      }
      // +1 to include the current visit (logged after we send the message)
      const since = config?.createdAt ?? '2000-01-01';
      visitCount = (await getShelterVisitCount(groupId, since)) + 1;
    }

    // Send the "safe to leave" message, including shelter duration when available
    const message = buildEndAlertMessage(clearedCities, language, durationMs, visitCount);

    log.info(
      {
        groupId,
        clearedCities,
        remainingActive: shelter.size,
      },
      'Sending end-alert to group'
    );

    await sendGroupMessage(groupId, message);
    groupsNotified.push(groupId);
  }

  // Log the end alert
  if (groupsNotified.length > 0) {
    await logAlert({
      alertType: alert.type,
      cities: alert.cities,
      instructions: alert.instructions || '',
      groupsNotified,
      eventType: 'endAlert',
      rawData: alert,
    });
  }
}

// =====================
// Status
// =====================

/**
 * Get the current active shelter state for a group.
 * Returns the set of city names currently under alert, or null.
 */
export function getActiveShelter(groupId: string): Set<string> | null {
  return activeShelters.get(groupId) || null;
}

/**
 * Get the count of groups currently in shelter.
 */
export function getActiveShelterCount(): number {
  return activeShelters.size;
}

/**
 * Clear all active shelter state (for testing/reset).
 */
export function clearAllShelters(): void {
  activeShelters.clear();
  shelterStartTimes.clear();
  lastNewsFlashPerGroup.clear();
  log.info('All active shelters cleared');
}
