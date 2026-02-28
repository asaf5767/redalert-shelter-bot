/**
 * Logger - configured pino logger for the bot
 *
 * Uses pino for fast, structured JSON logging.
 * Log level is controlled by the LOG_LEVEL env var.
 */

import pino from 'pino';
import { LOG_LEVEL } from '../config';

/** Main logger instance - use this throughout the app */
export const logger = pino({
  level: LOG_LEVEL,
  transport: {
    target: 'pino/file',
    options: { destination: 1 }, // stdout
  },
  // Add readable timestamps
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with a specific module name
 * Usage: const log = createLogger('whatsapp');
 *        log.info('Connected');  // logs { module: 'whatsapp', msg: 'Connected' }
 */
export function createLogger(module: string) {
  return logger.child({ module });
}
