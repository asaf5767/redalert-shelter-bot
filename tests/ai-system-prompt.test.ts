/**
 * Tests for Echo's AI system prompt.
 * Verifies the prompt contains bot capabilities info and the correct
 * instructions about when to surface them.
 */

// We only need the exported constant — stub everything else the module touches
jest.mock('../src/config', () => require('./__mocks__/config'));
jest.mock('../src/utils/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

import { SYSTEM_PROMPT } from '../src/services/ai';

describe('SYSTEM_PROMPT — Echo personality', () => {
  it('establishes Echo as the AI persona', () => {
    expect(SYSTEM_PROMPT).toContain('אקו');
    expect(SYSTEM_PROMPT).toContain('Echo');
  });

  it('encourages a casual Israeli style (not formal/bot-like)', () => {
    expect(SYSTEM_PROMPT).toContain('ישראלי');
  });

  it('instructs Echo to give real answers, not dodge', () => {
    expect(SYSTEM_PROMPT).toContain('לא להתחמק');
  });

  it('limits responses to WhatsApp length (2-5 sentences)', () => {
    expect(SYSTEM_PROMPT).toMatch(/2.5 משפטים/);
  });
});

describe('SYSTEM_PROMPT — bot capabilities section (added in this PR)', () => {
  it('has a "bot capabilities" section header', () => {
    expect(SYSTEM_PROMPT).toContain('יכולות הבוט');
  });

  it('instructs Echo to mention capabilities ONLY when directly asked', () => {
    expect(SYSTEM_PROMPT).toContain('הזכר רק אם שאלו');
  });

  it('describes the bot as connected to the Pikud HaOref system', () => {
    expect(SYSTEM_PROMPT).toContain('פיקוד העורף');
  });

  it('describes knowing when to enter/exit shelter', () => {
    expect(SYSTEM_PROMPT).toContain('ממ"ד');
  });

  it('lists the core city management commands', () => {
    expect(SYSTEM_PROMPT).toContain('!addcity');
    expect(SYSTEM_PROMPT).toContain('!removecity');
    expect(SYSTEM_PROMPT).toContain('!cities');
    expect(SYSTEM_PROMPT).toContain('!search');
    expect(SYSTEM_PROMPT).toContain('!clearalerts');
  });

  it('lists the utility commands', () => {
    expect(SYSTEM_PROMPT).toContain('!lang');
    expect(SYSTEM_PROMPT).toContain('!status');
    expect(SYSTEM_PROMPT).toContain('!test');
    expect(SYSTEM_PROMPT).toContain('!help');
  });

  it('lists the engagement feature commands', () => {
    expect(SYSTEM_PROMPT).toContain('!streak');
    expect(SYSTEM_PROMPT).toContain('!activities');
  });

  it('mentions natural-language triggers (אקו / @mention / reply)', () => {
    expect(SYSTEM_PROMPT).toContain('אקו');
    expect(SYSTEM_PROMPT).toContain('לתייג');
  });

  it('capabilities section appears after personality rules (not at the top)', () => {
    const capIdx = SYSTEM_PROMPT.indexOf('יכולות הבוט');
    const personalityIdx = SYSTEM_PROMPT.indexOf('אתה אקו');
    expect(capIdx).toBeGreaterThan(personalityIdx);
  });

  it('answer-only-last-message instruction is the final line', () => {
    const trimmed = SYSTEM_PROMPT.trimEnd();
    expect(trimmed.endsWith('ענה רק על ההודעה האחרונה. ההקשר ניתן לך כרקע.')).toBe(true);
  });
});
