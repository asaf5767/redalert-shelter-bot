/**
 * Tests for isCityMatch — the prefix-with-separator-boundary matching logic.
 * Exported from group-config.ts for testability.
 *
 * Key rules (from CLAUDE.md):
 *  - "ראש העין" matches "ראש העין - מזרח"  ✅ (group is prefix + separator)
 *  - "כרמל"     does NOT match "טירת כרמל" ❌ (substring in middle)
 */

// group-config has no side-effecting imports, but mock config to be safe
jest.mock('../src/config', () => require('./__mocks__/config'));
jest.mock('../src/utils/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock('../src/services/supabase', () => ({
  getGroupCityConfigs: jest.fn().mockResolvedValue([]),
  upsertGroupConfig: jest.fn().mockResolvedValue(undefined),
  deleteGroupConfig: jest.fn().mockResolvedValue(undefined),
}));

import { isCityMatch } from '../src/core/group-config';

describe('isCityMatch', () => {
  // --- Exact match ---
  it('exact match returns true', () => {
    expect(isCityMatch('תל אביב', 'תל אביב')).toBe(true);
  });

  it('exact match for short name returns true', () => {
    expect(isCityMatch('חיפה', 'חיפה')).toBe(true);
  });

  // --- Group city is a prefix of alert city ---
  it('group prefix + dash separator matches alert sub-district', () => {
    expect(isCityMatch('ראש העין', 'ראש העין - מזרח')).toBe(true);
  });

  it('group prefix + em-dash separator matches', () => {
    expect(isCityMatch('ראש העין', 'ראש העין – מזרח')).toBe(true);
  });

  it('group prefix + space separator matches', () => {
    // e.g., "תל אביב" matches "תל אביב צפון" (space separator)
    expect(isCityMatch('תל אביב', 'תל אביב צפון')).toBe(true);
  });

  // --- Alert city is a prefix of group city (reverse direction) ---
  it('alert is a prefix of group city (reverse prefix) returns true', () => {
    expect(isCityMatch('ראש העין - מזרח', 'ראש העין')).toBe(true);
  });

  // --- Substring-in-middle must NOT match ---
  it('כרמל does NOT match טירת כרמל (substring not at start)', () => {
    expect(isCityMatch('כרמל', 'טירת כרמל')).toBe(false);
  });

  it('עין does NOT match ראש העין (suffix, not prefix)', () => {
    expect(isCityMatch('עין', 'ראש העין')).toBe(false);
  });

  it('אביב does NOT match תל אביב (partial suffix)', () => {
    expect(isCityMatch('אביב', 'תל אביב')).toBe(false);
  });

  // --- Completely different cities ---
  it('completely different cities return false', () => {
    expect(isCityMatch('חיפה', 'תל אביב')).toBe(false);
  });

  it('empty alert city does not match non-empty group city', () => {
    expect(isCityMatch('חיפה', '')).toBe(false);
  });

  // --- Edge cases ---
  it('both empty strings are an exact match', () => {
    expect(isCityMatch('', '')).toBe(true);
  });

  it('prefix without a valid separator does NOT match', () => {
    // "ראש" is a prefix of "ראש העין" but there is no valid separator after it
    // 'ראש' + ' העין' — the space IS a separator so this should match
    // Actually space IS in SEPARATORS, so "ראש" + " העין" would match
    // Let's test something that truly won't match: a prefix directly followed by letters
    expect(isCityMatch('ראש', 'ראשון לציון')).toBe(false);
  });
});
