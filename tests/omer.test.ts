/**
 * Tests for Sefirat HaOmer feature.
 *
 * Covers:
 * - getOmerBreakdown() — all 49 days produce correct Hebrew wording
 * - buildOmerReminderMessage() — Hebrew and English formatting
 * - getOmerDay() — calendar boundary logic with mocked dates
 * - Snapshot test of all 49 Hebrew messages to catch accidental wording changes
 */

import {
  getOmerBreakdown,
  buildOmerReminderMessage,
  getOmerDay,
} from '../src/utils/messages';

// ---------------------------------------------------------------------------
// getOmerBreakdown — all 49 days
// ---------------------------------------------------------------------------

describe('getOmerBreakdown', () => {
  // Days 1–6: no breakdown (less than a full week)
  it.each([1, 2, 3, 4, 5, 6])('day %i → empty string (no breakdown)', (day) => {
    expect(getOmerBreakdown(day)).toBe('');
  });

  // Exact-week days: breakdown uses OMER_WEEK_WORDS (Hebrew spelled out)
  it('day  7 → שהם שבוע אחד', () => expect(getOmerBreakdown(7)).toBe('שהם שבוע אחד'));
  it('day 14 → שהם שני שבועות', () => expect(getOmerBreakdown(14)).toBe('שהם שני שבועות'));
  it('day 21 → שהם שלושה שבועות', () => expect(getOmerBreakdown(21)).toBe('שהם שלושה שבועות'));
  it('day 28 → שהם ארבעה שבועות', () => expect(getOmerBreakdown(28)).toBe('שהם ארבעה שבועות'));
  it('day 35 → שהם חמישה שבועות', () => expect(getOmerBreakdown(35)).toBe('שהם חמישה שבועות'));
  it('day 42 → שהם שישה שבועות', () => expect(getOmerBreakdown(42)).toBe('שהם שישה שבועות'));
  it('day 49 → שהם שבעה שבועות', () => expect(getOmerBreakdown(49)).toBe('שהם שבעה שבועות'));

  // Mixed weeks + days: numeric week count + Hebrew day words (user's spec)
  it('day  8 → שהם שבוע אחד ויום אחד', () => expect(getOmerBreakdown(8)).toBe('שהם שבוע אחד ויום אחד'));
  it('day  9 → שהם שבוע אחד ושני ימים', () => expect(getOmerBreakdown(9)).toBe('שהם שבוע אחד ושני ימים'));
  it('day 10 → שהם שבוע אחד ושלושה ימים', () => expect(getOmerBreakdown(10)).toBe('שהם שבוע אחד ושלושה ימים'));
  it('day 11 → שהם שבוע אחד וארבעה ימים', () => expect(getOmerBreakdown(11)).toBe('שהם שבוע אחד וארבעה ימים'));
  it('day 12 → שהם שבוע אחד וחמישה ימים', () => expect(getOmerBreakdown(12)).toBe('שהם שבוע אחד וחמישה ימים'));
  it('day 13 → שהם שבוע אחד ושישה ימים', () => expect(getOmerBreakdown(13)).toBe('שהם שבוע אחד ושישה ימים'));

  it('day 15 → שהם 2 שבועות ויום אחד', () => expect(getOmerBreakdown(15)).toBe('שהם 2 שבועות ויום אחד'));
  it('day 16 → שהם 2 שבועות ושני ימים', () => expect(getOmerBreakdown(16)).toBe('שהם 2 שבועות ושני ימים'));
  it('day 20 → שהם 2 שבועות ושישה ימים', () => expect(getOmerBreakdown(20)).toBe('שהם 2 שבועות ושישה ימים'));

  // User's explicit examples
  it('day 22 → שהם 3 שבועות ויום אחד', () => expect(getOmerBreakdown(22)).toBe('שהם 3 שבועות ויום אחד'));
  it('day 37 → שהם 5 שבועות ושני ימים', () => expect(getOmerBreakdown(37)).toBe('שהם 5 שבועות ושני ימים'));

  it('day 29 → שהם 4 שבועות ויום אחד', () => expect(getOmerBreakdown(29)).toBe('שהם 4 שבועות ויום אחד'));
  it('day 36 → שהם 5 שבועות ויום אחד', () => expect(getOmerBreakdown(36)).toBe('שהם 5 שבועות ויום אחד'));
  it('day 43 → שהם 6 שבועות ויום אחד', () => expect(getOmerBreakdown(43)).toBe('שהם 6 שבועות ויום אחד'));
  it('day 48 → שהם 6 שבועות ושישה ימים', () => expect(getOmerBreakdown(48)).toBe('שהם 6 שבועות ושישה ימים'));

  // Every day from 1–49 should return a string (no crashes)
  it.each(Array.from({ length: 49 }, (_, i) => i + 1))(
    'day %i returns a string without throwing',
    (day) => {
      expect(() => getOmerBreakdown(day)).not.toThrow();
      expect(typeof getOmerBreakdown(day)).toBe('string');
    }
  );
});

// ---------------------------------------------------------------------------
// buildOmerReminderMessage — Hebrew
// ---------------------------------------------------------------------------

describe('buildOmerReminderMessage (Hebrew)', () => {
  it('day 1: contains correct count line', () => {
    const msg = buildOmerReminderMessage(1, 'he');
    expect(msg).toContain('היום 1 יום לעומר');
    // No breakdown for day 1
    expect(msg).not.toContain('שהם');
  });

  it('day 2: uses plural ימים', () => {
    expect(buildOmerReminderMessage(2, 'he')).toContain('היום 2 ימים לעומר');
  });

  it('day 6: still no breakdown', () => {
    const msg = buildOmerReminderMessage(6, 'he');
    expect(msg).toContain('היום 6 ימים לעומר');
    expect(msg).not.toContain('שהם');
  });

  it('day 7: includes שהם שבוע אחד', () => {
    const msg = buildOmerReminderMessage(7, 'he');
    expect(msg).toContain('היום 7 יום לעומר שהם שבוע אחד');
  });

  it('day 8: includes שבוע אחד ויום אחד', () => {
    expect(buildOmerReminderMessage(8, 'he')).toContain('היום 8 יום לעומר שהם שבוע אחד ויום אחד');
  });

  it('day 14: includes שני שבועות', () => {
    expect(buildOmerReminderMessage(14, 'he')).toContain('שהם שני שבועות');
  });

  // User's explicit examples
  it('day 22: exact user spec', () => {
    expect(buildOmerReminderMessage(22, 'he')).toContain('היום 22 יום לעומר שהם 3 שבועות ויום אחד');
  });

  it('day 37: exact user spec', () => {
    expect(buildOmerReminderMessage(37, 'he')).toContain('היום 37 יום לעומר שהם 5 שבועות ושני ימים');
  });

  it('day 49: includes שבעה שבועות', () => {
    expect(buildOmerReminderMessage(49, 'he')).toContain('שהם שבעה שבועות');
  });

  it('includes the emoji and framing', () => {
    const msg = buildOmerReminderMessage(1, 'he');
    expect(msg).toContain('📿');
    expect(msg).toContain('🌙');
    expect(msg).toContain('מתוך 49');
  });

  it('wraps count line in italic quotes (_"..."_)', () => {
    const msg = buildOmerReminderMessage(5, 'he');
    expect(msg).toContain('_"');
    expect(msg).toContain('"_');
  });
});

// ---------------------------------------------------------------------------
// buildOmerReminderMessage — English
// ---------------------------------------------------------------------------

describe('buildOmerReminderMessage (English)', () => {
  it('day 1: no breakdown', () => {
    const msg = buildOmerReminderMessage(1, 'en');
    expect(msg).toContain('Day 1');
    expect(msg).not.toContain('week');
  });

  it('day 7: 1 week', () => {
    expect(buildOmerReminderMessage(7, 'en')).toContain('1 week');
  });

  it('day 8: 1 week and 1 day', () => {
    expect(buildOmerReminderMessage(8, 'en')).toContain('1 week and 1 day');
  });

  it('day 22: 3 weeks and 1 day (user spec)', () => {
    expect(buildOmerReminderMessage(22, 'en')).toContain('3 weeks and 1 day');
  });

  it('day 37: 5 weeks and 2 days (user spec)', () => {
    expect(buildOmerReminderMessage(37, 'en')).toContain('5 weeks and 2 days');
  });

  it('day 14: 2 weeks (no extra days)', () => {
    const msg = buildOmerReminderMessage(14, 'en');
    expect(msg).toContain('2 weeks');
    expect(msg).not.toContain('and 0');
  });

  it('includes 49 and emoji', () => {
    const msg = buildOmerReminderMessage(1, 'en');
    expect(msg).toContain('49');
    expect(msg).toContain('📿');
    expect(msg).toContain('🌙');
  });
});

// ---------------------------------------------------------------------------
// getOmerDay — calendar boundary logic
// ---------------------------------------------------------------------------

describe('getOmerDay', () => {
  const RealDate = global.Date;

  afterEach(() => {
    // Restore real Date after each test
    global.Date = RealDate;
  });

  function mockIsraelDate(isoDate: string): void {
    // Override toLocaleDateString for 'en-CA' + Asia/Jerusalem to return isoDate
    const MockDate = class extends RealDate {
      toLocaleDateString(locale?: string, opts?: Intl.DateTimeFormatOptions): string {
        if (locale === 'en-CA' && opts?.timeZone === 'Asia/Jerusalem') {
          return isoDate;
        }
        return super.toLocaleDateString(locale, opts);
      }
    } as unknown as typeof Date;
    global.Date = MockDate;
  }

  it('returns 1 on Omer day 1 (April 2, 2026)', () => {
    mockIsraelDate('2026-04-02');
    expect(getOmerDay()).toBe(1);
  });

  it('returns 5 on April 6, 2026', () => {
    mockIsraelDate('2026-04-06');
    expect(getOmerDay()).toBe(5);
  });

  it('returns 49 on the last day (May 20, 2026)', () => {
    mockIsraelDate('2026-05-20');
    expect(getOmerDay()).toBe(49);
  });

  it('returns null on April 1, 2026 (day before Omer starts)', () => {
    mockIsraelDate('2026-04-01');
    expect(getOmerDay()).toBeNull();
  });

  it('returns null on May 21, 2026 (day after Omer ends)', () => {
    mockIsraelDate('2026-05-21');
    expect(getOmerDay()).toBeNull();
  });

  it('returns null in November (well outside Omer)', () => {
    mockIsraelDate('2026-11-15');
    expect(getOmerDay()).toBeNull();
  });

  it('returns null for an unconfigured year (2025)', () => {
    mockIsraelDate('2025-04-14');
    expect(getOmerDay()).toBeNull();
  });

  it('returns 1 on 2027 Omer day 1 (April 21, 2027)', () => {
    mockIsraelDate('2027-04-21');
    expect(getOmerDay()).toBe(1);
  });

  it('returns null on April 20, 2027 (day before 2027 Omer)', () => {
    mockIsraelDate('2027-04-20');
    expect(getOmerDay()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Snapshot — all 49 Hebrew messages
// ---------------------------------------------------------------------------

describe('buildOmerReminderMessage — all 49 days snapshot (Hebrew)', () => {
  it('produces stable Hebrew output for days 1–49', () => {
    const all = Array.from({ length: 49 }, (_, i) => ({
      day: i + 1,
      message: buildOmerReminderMessage(i + 1, 'he'),
    }));
    expect(all).toMatchSnapshot();
  });
});
