/**
 * Omer Scheduler — daily Sefirat HaOmer reminders at 8pm Israel time
 *
 * Polls every 60 seconds. When the clock hits 20:00 Israel time and
 * we are inside the 49-day Omer window, sends a reminder message to
 * every group that has opted in via `!omer on`.
 *
 * Call scheduleOmerReminders() once during app startup.
 */

import { getAllConfigs } from '../core/group-config';
import { sendGroupMessage } from './whatsapp';
import { buildOmerReminderMessage, getOmerDay } from '../utils/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('omer-scheduler');

export function scheduleOmerReminders(): void {
  let lastSentDate = '';

  setInterval(async () => {
    const now = new Date();
    const israelTime = now.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jerusalem',
      hour12: false,
    });
    const israelDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

    const [hourStr, minuteStr] = israelTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (hour !== 20 || minute !== 0) return;
    if (israelDate === lastSentDate) return; // already sent today
    lastSentDate = israelDate;

    const day = getOmerDay();
    if (!day) return; // outside Omer period

    const configs = getAllConfigs();
    for (const config of configs) {
      if (!config.settings?.omerEnabled) continue;
      try {
        const msg = buildOmerReminderMessage(day, config.language);
        await sendGroupMessage(config.groupId, msg);
        log.info({ groupId: config.groupId, day }, 'Sent Omer reminder');
      } catch (err) {
        log.error({ err, groupId: config.groupId }, 'Failed to send Omer reminder');
      }
    }
  }, 60_000);
}
