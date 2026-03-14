/**
 * Text-to-Speech Service — Hebrew voice notes via edge-tts
 *
 * Uses Microsoft Edge's free TTS API (no API key needed) to generate
 * Hebrew voice notes that Echo can send as WhatsApp push-to-talk messages.
 *
 * Pipeline: text → edge-tts (MP3) → ffmpeg (OGG/Opus) → WhatsApp voice note
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { createLogger } from '../utils/logger';

const execAsync = promisify(exec);
const log = createLogger('tts');

/** Hebrew male voice — deep, authoritative */
const VOICE = 'he-IL-AvriNeural';

/** Temp directory for generated audio files */
const TMP_DIR = '/tmp/tts';

// Ensure tmp dir exists on module load
try {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
} catch {
  // Will fail gracefully when textToVoiceNote is called
}

/**
 * Convert text to an OGG/Opus voice note file using edge-tts + ffmpeg.
 *
 * @param text - Hebrew (or English) text to speak
 * @returns Path to the generated .ogg file, or null on failure
 */
export async function textToVoiceNote(text: string): Promise<string | null> {
  const id = `echo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mp3Path = `${TMP_DIR}/${id}.mp3`;
  const oggPath = `${TMP_DIR}/${id}.ogg`;

  try {
    // Strip model tags and clean up text for TTS
    const cleanText = text
      .replace(/\n_\(.+?\)_$/m, '')  // Remove _(Claude Sonnet)_ / _(Groq)_ tag
      .replace(/🤖\s?/, '')          // Remove bot emoji prefix
      .trim();

    if (!cleanText) {
      log.warn('Empty text after cleanup — skipping TTS');
      return null;
    }

    // 1. Generate MP3 with edge-tts
    // Use single quotes for the text to handle Hebrew + special characters
    const escapedText = cleanText.replace(/'/g, "'\\''");
    await execAsync(
      `edge-tts --voice "${VOICE}" --text '${escapedText}' --write-media "${mp3Path}"`,
      { timeout: 30000 }
    );

    if (!existsSync(mp3Path)) {
      log.error('edge-tts did not create MP3 file');
      return null;
    }

    // 2. Convert to OGG/Opus (WhatsApp voice note format)
    await execAsync(
      `ffmpeg -y -i "${mp3Path}" -avoid_negative_ts make_zero -ac 1 -c:a libopus "${oggPath}"`,
      { timeout: 15000 }
    );

    // 3. Clean up intermediate MP3
    try { unlinkSync(mp3Path); } catch {}

    if (!existsSync(oggPath)) {
      log.error('ffmpeg did not create OGG file');
      return null;
    }

    log.info({ oggPath, textLength: cleanText.length }, 'Voice note generated');
    return oggPath;
  } catch (err) {
    log.error({ err }, 'TTS generation failed');
    // Clean up any partial files
    try { unlinkSync(mp3Path); } catch {}
    try { unlinkSync(oggPath); } catch {}
    return null;
  }
}

/**
 * Clean up a voice note file after sending.
 * Fire-and-forget — silently ignores errors.
 */
export function cleanupVoiceNote(path: string): void {
  try { unlinkSync(path); } catch {}
}
