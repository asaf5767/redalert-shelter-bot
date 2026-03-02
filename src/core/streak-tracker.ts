/**
 * Streak Tracker - announces milestones of silence since the last alert
 *
 * Per group (when streakEnabled):
 * - Checks every 15 minutes if a milestone has been crossed
 * - Milestones: 6h, 12h, 24h, 48h, 72h, 1 week
 * - "שיא חדש!" when the current streak beats the group's all-time record
 * - Resets when a real alert fires (via onAlertFired)
 */

import * as groupConfig from './group-config';
import { sendGroupMessage } from '../services/whatsapp';
import { buildStreakMilestoneMessage } from '../utils/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('streak');

/** Milestone thresholds in hours */
const STREAK_MILESTONES_HOURS = [6, 12, 24, 48, 72, 168];

/** How often to check for crossed milestones */
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// =====================
// Public API
// =====================

/**
 * Start the background timer that checks streak milestones.
 * Call once on bot startup.
 */
export function startStreakTimer(): void {
  setInterval(checkStreakMilestones, CHECK_INTERVAL_MS);
  log.info('Streak milestone timer started (15-min interval)');
}

/**
 * Notify the streak tracker that a real alert just fired for a group.
 * Resets the streak clock and saves the previous streak as a potential record.
 */
export async function onAlertFired(groupId: string): Promise<void> {
  await groupConfig.resetStreak(groupId);
}

// =====================
// Milestone Checker
// =====================

async function checkStreakMilestones(): Promise<void> {
  const now = Date.now();

  for (const config of groupConfig.getAllConfigs()) {
    if (!config.enabled || !config.settings.streakEnabled) continue;

    const { lastAlertAt, longestStreakMs = 0, lastMilestoneHours = 0 } = config.settings;

    // No reference point yet — nothing to count from
    if (!lastAlertAt) continue;

    const streakMs = now - lastAlertAt;
    const streakHours = streakMs / (1000 * 60 * 60);

    // Find milestones that were crossed but not yet announced
    // Announce the highest one that was crossed (skips intermediate ones if the bot was down)
    const crossed = STREAK_MILESTONES_HOURS.filter(
      (m) => streakHours >= m && m > lastMilestoneHours
    );
    if (crossed.length === 0) continue;

    const milestone = crossed[crossed.length - 1]; // highest crossed
    const isRecord = streakMs > longestStreakMs;

    try {
      const message = buildStreakMilestoneMessage(milestone, isRecord, config.language);
      await sendGroupMessage(config.groupId, message);

      log.info(
        { groupId: config.groupId, milestone, isRecord, streakHours: Math.round(streakHours) },
        'Streak milestone announced'
      );

      await groupConfig.updateStreakMilestone(
        config.groupId,
        milestone,
        isRecord ? streakMs : undefined
      );
    } catch (err) {
      log.error({ err, groupId: config.groupId, milestone }, 'Failed to announce streak milestone');
    }
  }
}
