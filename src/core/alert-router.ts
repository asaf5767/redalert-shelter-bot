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

import { RedAlertEvent } from '../types';
import * as groupConfig from './group-config';
import { getCountdown } from './city-database';
import { sendGroupMessage } from '../services/whatsapp';
import { logAlert } from '../services/supabase';
import { buildAlertMessage, buildEndAlertMessage, buildNewsFlashMessage } from '../utils/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('alert-router');

/**
 * Active shelter state: tracks which cities each group is currently sheltering for.
 * Key: groupId, Value: Set of city names currently under alert
 */
const activeShelters = new Map<string, Set<string>>();

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

    const groupsNotified: string[] = [];

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

      if (newCities.length === 0) {
        log.debug(
          { groupId: config.groupId, matchedCities },
          'Group already sheltering for these cities - skipping'
        );
        continue;
      }

      // Add new cities to active shelter tracking
      for (const city of newCities) {
        shelter.add(city.toLowerCase());
      }

      // Build and send the shelter message
      // Get the shortest countdown time among the matched cities
      const countdowns = newCities
        .map((c) => getCountdown(c))
        .filter((c): c is number => c !== null);
      const minCountdown = countdowns.length > 0 ? Math.min(...countdowns) : null;

      const message = buildAlertMessage(alert, newCities, config.language, minCountdown);

      log.info(
        {
          groupId: config.groupId,
          groupName: config.groupName,
          newCities,
        },
        'Sending shelter alert to group'
      );

      await sendGroupMessage(config.groupId, message);
      groupsNotified.push(config.groupId);
    }

    // Log the alert to database
    if (groupsNotified.length > 0) {
      await logAlert({
        alertType: alert.type,
        cities: alert.cities,
        instructions: alert.instructions,
        groupsNotified,
        eventType: 'alert',
        rawData: alert,
      });
    }
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
    const message = buildNewsFlashMessage(matchedCities, config.language);

    log.info(
      { groupId: config.groupId, matchedCities },
      'Sending newsFlash to group'
    );

    await sendGroupMessage(config.groupId, message);
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

    // Get the group's config for language preference
    const config = groupConfig.getGroupConfig(groupId);
    const language = config?.language || 'he';

    // Send the "safe to leave" message
    const message = buildEndAlertMessage(clearedCities, language);

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

    // If no more active cities, clean up the shelter entry
    if (shelter.size === 0) {
      activeShelters.delete(groupId);
    }
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
  log.info('All active shelters cleared');
}
