import { formatTotalShelterTime, buildEndAlertMessage } from '../src/utils/messages';

// ---------------------------------------------------------------------------
// formatTotalShelterTime — unit tests for the formatting helper
// ---------------------------------------------------------------------------

describe('formatTotalShelterTime', () => {
  it('returns empty string for undefined', () => {
    expect(formatTotalShelterTime(undefined, 'he')).toBe('');
    expect(formatTotalShelterTime(undefined, 'en')).toBe('');
  });

  it('returns empty string for zero', () => {
    expect(formatTotalShelterTime(0, 'he')).toBe('');
    expect(formatTotalShelterTime(0, 'en')).toBe('');
  });

  it('returns empty string for negative values', () => {
    expect(formatTotalShelterTime(-1000, 'he')).toBe('');
    expect(formatTotalShelterTime(-60_000, 'en')).toBe('');
  });

  it('Hebrew: shows "פחות מדקה" for < 30 seconds (rounds to 0 min)', () => {
    expect(formatTotalShelterTime(20_000, 'he')).toBe('פחות מדקה');
  });

  it('English: shows "under a minute" for < 30 seconds (rounds to 0 min)', () => {
    expect(formatTotalShelterTime(20_000, 'en')).toBe('under a minute');
  });

  it('Hebrew: 30 seconds rounds to 1 minute', () => {
    expect(formatTotalShelterTime(30_000, 'he')).toBe('1 דקות');
  });

  it('English: 30 seconds rounds to 1 minute', () => {
    expect(formatTotalShelterTime(30_000, 'en')).toBe('1 minutes');
  });

  it('Hebrew: shows minutes for < 60 minutes', () => {
    expect(formatTotalShelterTime(5 * 60_000, 'he')).toBe('5 דקות');
    expect(formatTotalShelterTime(45 * 60_000, 'he')).toBe('45 דקות');
  });

  it('English: shows minutes for < 60 minutes', () => {
    expect(formatTotalShelterTime(5 * 60_000, 'en')).toBe('5 minutes');
    expect(formatTotalShelterTime(45 * 60_000, 'en')).toBe('45 minutes');
  });

  it('Hebrew: shows hours + minutes for >= 60 minutes', () => {
    // 1 hour 30 minutes
    expect(formatTotalShelterTime(90 * 60_000, 'he')).toBe('1 שעות ו-30 דקות');
    // 2 hours 15 minutes
    expect(formatTotalShelterTime(135 * 60_000, 'he')).toBe('2 שעות ו-15 דקות');
  });

  it('English: shows hours + minutes for >= 60 minutes', () => {
    expect(formatTotalShelterTime(90 * 60_000, 'en')).toBe('1 hours and 30 minutes');
    expect(formatTotalShelterTime(135 * 60_000, 'en')).toBe('2 hours and 15 minutes');
  });

  it('Hebrew: shows hours only when minutes are 0', () => {
    expect(formatTotalShelterTime(120 * 60_000, 'he')).toBe('2 שעות');
  });

  it('English: shows hours only when minutes are 0', () => {
    expect(formatTotalShelterTime(120 * 60_000, 'en')).toBe('2 hours');
  });

  it('rounds to nearest minute', () => {
    // 5 min 29 sec → 5 min
    expect(formatTotalShelterTime(5 * 60_000 + 29_000, 'en')).toBe('5 minutes');
    // 5 min 31 sec → 6 min
    expect(formatTotalShelterTime(5 * 60_000 + 31_000, 'en')).toBe('6 minutes');
  });

  it('handles large values (many hours)', () => {
    // 10 hours 45 minutes
    const ms = (10 * 60 + 45) * 60_000;
    expect(formatTotalShelterTime(ms, 'en')).toBe('10 hours and 45 minutes');
    expect(formatTotalShelterTime(ms, 'he')).toBe('10 שעות ו-45 דקות');
  });
});

// ---------------------------------------------------------------------------
// buildEndAlertMessage — regression tests for existing behavior + new total
// ---------------------------------------------------------------------------

describe('buildEndAlertMessage with totalShelterTimeMs', () => {
  it('does not show total time line when totalShelterTimeMs is undefined', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', 5 * 60_000, 3);
    expect(msg).not.toContain('מאז שהצטרפתי:');
    expect(msg).not.toContain('Total shelter time');
  });

  it('does not show total time line when totalShelterTimeMs is 0', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', 5 * 60_000, 3, 0);
    expect(msg).not.toContain('מאז שהצטרפתי:');
  });

  it('Hebrew: shows total shelter time when provided', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', 5 * 60_000, 3, 90 * 60_000);
    expect(msg).toContain('סה"כ זמן בממ"ד מאז שהצטרפתי:');
    expect(msg).toContain('1 שעות ו-30 דקות');
  });

  it('English: shows total shelter time when provided', () => {
    const msg = buildEndAlertMessage(['Tel Aviv'], 'en', 5 * 60_000, 3, 90 * 60_000);
    expect(msg).toContain('Total shelter time since I joined:');
    expect(msg).toContain('1 hours and 30 minutes');
  });

  it('shows total time even when session duration is undefined (edge case)', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', undefined, undefined, 60 * 60_000);
    expect(msg).toContain('סה"כ זמן בממ"ד מאז שהצטרפתי:');
    expect(msg).toContain('1 שעות');
  });

  // Regression: existing behavior unchanged
  it('regression: still shows session duration without total', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', 5 * 60_000);
    expect(msg).toContain('סה"כ זמן בממ"ד: *כ-5 דקות*');
    expect(msg).not.toContain('מאז שהצטרפתי:');
  });

  it('regression: still shows visit count without total', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', undefined, 7);
    expect(msg).toContain('7');
    expect(msg).toContain('מספר כניסות');
  });

  it('regression: no stats shown when nothing provided', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he');
    expect(msg).not.toContain('⏱️');
    expect(msg).not.toContain('📊');
  });

  it('regression: English basic end alert unchanged', () => {
    const msg = buildEndAlertMessage(['Haifa'], 'en');
    expect(msg).toContain('Event Ended');
    expect(msg).toContain('Haifa');
    expect(msg).toContain('safe');
  });

  it('shows all three stats together', () => {
    const msg = buildEndAlertMessage(['חיפה'], 'he', 3 * 60_000, 5, 120 * 60_000);
    expect(msg).toContain('כ-3 דקות');   // session duration
    expect(msg).toContain('5');           // visit count
    expect(msg).toContain('2 שעות');      // total time
  });
});
