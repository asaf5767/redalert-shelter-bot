import {
  msgWelcome,
  msgHelp,
  msgCitiesList,
  msgCitiesAdded,
  msgCitiesRemoved,
  msgCitiesCleared,
  msgStatus,
  msgLanguageChanged,
  buildAlertMessage,
  buildEndAlertMessage,
  buildNewsFlashMessage,
  getRandomActivity,
} from '../src/utils/messages';
import { RedAlertEvent } from '../src/types';

// ---------------------------------------------------------------------------
// msgWelcome — new function added in this PR
// ---------------------------------------------------------------------------

describe('msgWelcome', () => {
  it('Hebrew: mentions Pikud HaOref alert system', () => {
    const msg = msgWelcome('he');
    expect(msg).toContain('פיקוד העורף');
  });

  it('Hebrew: tells users exactly when to enter/exit shelter', () => {
    const msg = msgWelcome('he');
    expect(msg).toContain('ממ"ד');
  });

  it('Hebrew: shows !addcity and !help commands', () => {
    const msg = msgWelcome('he');
    expect(msg).toContain('!addcity');
    expect(msg).toContain('!help');
  });

  it('Hebrew: mentions Echo (אקו) for AI chat', () => {
    const msg = msgWelcome('he');
    expect(msg).toContain('אקו');
  });

  it('English: mentions Pikud HaOref', () => {
    const msg = msgWelcome('en');
    expect(msg).toContain('Pikud HaOref');
  });

  it('English: mentions shelter', () => {
    const msg = msgWelcome('en');
    expect(msg).toContain('shelter');
  });

  it('English: shows !addcity and !help commands', () => {
    const msg = msgWelcome('en');
    expect(msg).toContain('!addcity');
    expect(msg).toContain('!help');
  });

  it('English: mentions echo for AI chat', () => {
    const msg = msgWelcome('en');
    expect(msg).toContain('echo');
  });

  it('he/en messages are different', () => {
    expect(msgWelcome('he')).not.toBe(msgWelcome('en'));
  });
});

// ---------------------------------------------------------------------------
// msgHelp
// ---------------------------------------------------------------------------

describe('msgHelp', () => {
  const ALL_COMMANDS = [
    '!addcity', '!removecity', '!cities', '!search',
    '!clearalerts', '!lang', '!status', '!test',
    '!activities', '!help',
  ];

  it('Hebrew: contains all commands', () => {
    const msg = msgHelp('he');
    for (const cmd of ALL_COMMANDS) {
      expect(msg).toContain(cmd);
    }
  });

  it('English: contains all commands', () => {
    const msg = msgHelp('en');
    for (const cmd of ALL_COMMANDS) {
      expect(msg).toContain(cmd);
    }
  });

  it('Hebrew: mentions AI (אקו)', () => {
    expect(msgHelp('he')).toContain('אקו');
  });

  it('English: mentions echo', () => {
    expect(msgHelp('en')).toContain('echo');
  });

  it('Hebrew: mentions tagging tip (לתייג)', () => {
    expect(msgHelp('he')).toContain('לתייג');
  });
});

// ---------------------------------------------------------------------------
// msgCitiesList
// ---------------------------------------------------------------------------

describe('msgCitiesList', () => {
  it('Hebrew: empty list prompts to add a city', () => {
    const msg = msgCitiesList([], 'he');
    expect(msg).toContain('!addcity');
  });

  it('English: empty list prompts to add a city', () => {
    const msg = msgCitiesList([], 'en');
    expect(msg).toContain('!addcity');
  });

  it('Hebrew: lists all provided cities', () => {
    const msg = msgCitiesList(['תל אביב', 'חיפה', 'ירושלים'], 'he');
    expect(msg).toContain('תל אביב');
    expect(msg).toContain('חיפה');
    expect(msg).toContain('ירושלים');
  });

  it('English: lists all provided cities', () => {
    const msg = msgCitiesList(['Tel Aviv', 'Haifa'], 'en');
    expect(msg).toContain('Tel Aviv');
    expect(msg).toContain('Haifa');
  });

  it('numbers each city starting from 1', () => {
    const msg = msgCitiesList(['א', 'ב'], 'he');
    expect(msg).toContain('1.');
    expect(msg).toContain('2.');
  });
});

// ---------------------------------------------------------------------------
// msgCitiesAdded / msgCitiesRemoved / msgCitiesCleared
// ---------------------------------------------------------------------------

describe('msgCitiesAdded', () => {
  it('Hebrew: includes city name', () => {
    expect(msgCitiesAdded(['תל אביב'], 'he')).toContain('תל אביב');
  });

  it('English: includes city name', () => {
    expect(msgCitiesAdded(['Haifa'], 'en')).toContain('Haifa');
  });

  it('includes multiple cities', () => {
    const msg = msgCitiesAdded(['תל אביב', 'חיפה'], 'he');
    expect(msg).toContain('תל אביב');
    expect(msg).toContain('חיפה');
  });
});

describe('msgCitiesRemoved', () => {
  it('Hebrew: includes city name', () => {
    expect(msgCitiesRemoved(['חיפה'], 'he')).toContain('חיפה');
  });

  it('English: includes city name', () => {
    expect(msgCitiesRemoved(['Haifa'], 'en')).toContain('Haifa');
  });
});

describe('msgCitiesCleared', () => {
  it('Hebrew: returns non-empty string', () => {
    expect(msgCitiesCleared('he').length).toBeGreaterThan(0);
  });

  it('English: returns non-empty string', () => {
    expect(msgCitiesCleared('en').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// msgStatus
// ---------------------------------------------------------------------------

describe('msgStatus', () => {
  it('Hebrew: shows connected status', () => {
    const msg = msgStatus(true, true, 3, 0, 'he');
    expect(msg).toContain('🟢');
    expect(msg).toContain('3');
  });

  it('Hebrew: shows disconnected status', () => {
    const msg = msgStatus(false, false, 0, 0, 'he');
    expect(msg).toContain('🔴');
  });

  it('English: shows connected status', () => {
    const msg = msgStatus(true, true, 5, 0, 'en');
    expect(msg).toContain('🟢');
    expect(msg).toContain('5');
  });

  it('shows pending message count when > 0', () => {
    const msg = msgStatus(true, true, 0, 7, 'he');
    expect(msg).toContain('7');
  });

  it('omits pending count when 0', () => {
    const msg = msgStatus(true, true, 0, 0, 'he');
    // Should not mention queued/pending
    expect(msg).not.toMatch(/ממתינות: 0/);
  });
});

// ---------------------------------------------------------------------------
// msgLanguageChanged
// ---------------------------------------------------------------------------

describe('msgLanguageChanged', () => {
  it('Hebrew: returns non-empty string', () => {
    expect(msgLanguageChanged('he').length).toBeGreaterThan(0);
  });

  it('English: returns non-empty string', () => {
    expect(msgLanguageChanged('en').length).toBeGreaterThan(0);
  });

  it('he and en responses are different', () => {
    expect(msgLanguageChanged('he')).not.toBe(msgLanguageChanged('en'));
  });
});

// ---------------------------------------------------------------------------
// buildAlertMessage
// ---------------------------------------------------------------------------

describe('buildAlertMessage', () => {
  const missilesAlert: RedAlertEvent = { type: 'missiles', cities: ['תל אביב'], instructions: '' };
  const earthquakeAlert: RedAlertEvent = { type: 'earthQuake', cities: ['ירושלים'], instructions: '' };

  it('Hebrew: contains matched city name', () => {
    const msg = buildAlertMessage(missilesAlert, ['תל אביב'], 'he');
    expect(msg).toContain('תל אביב');
  });

  it('Hebrew: contains Hebrew alert type for missiles', () => {
    const msg = buildAlertMessage(missilesAlert, ['תל אביב'], 'he');
    expect(msg).toContain('טילים');
  });

  it('English: contains matched city', () => {
    const msg = buildAlertMessage(missilesAlert, ['Tel Aviv'], 'en');
    expect(msg).toContain('Tel Aviv');
  });

  it('English: contains English alert type for missiles', () => {
    const msg = buildAlertMessage(missilesAlert, ['Tel Aviv'], 'en');
    expect(msg).toContain('Missiles');
  });

  it('Hebrew: falls back to raw type for unknown alert', () => {
    const unknownAlert: RedAlertEvent = { type: 'unknownThing', cities: [], instructions: '' };
    const msg = buildAlertMessage(unknownAlert, ['עיר'], 'he');
    expect(msg).toContain('unknownThing');
  });

  it('includes multiple cities', () => {
    const msg = buildAlertMessage(missilesAlert, ['תל אביב', 'חיפה'], 'he');
    expect(msg).toContain('תל אביב');
    expect(msg).toContain('חיפה');
  });

  it('Hebrew earthquake message mentions earthquake type', () => {
    const msg = buildAlertMessage(earthquakeAlert, ['ירושלים'], 'he');
    expect(msg).toContain('רעידת אדמה');
  });

  it('Hebrew: uses professional alert header', () => {
    const msg = buildAlertMessage(missilesAlert, ['תל אביב'], 'he');
    expect(msg).toContain('התראה');
  });

  it('English: uses professional alert header', () => {
    const msg = buildAlertMessage(missilesAlert, ['Tel Aviv'], 'en');
    expect(msg).toContain('Alert');
  });
});

// ---------------------------------------------------------------------------
// buildEndAlertMessage
// ---------------------------------------------------------------------------

describe('buildEndAlertMessage', () => {
  it('Hebrew: contains matched city', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he');
    expect(msg).toContain('תל אביב');
  });

  it('English: contains matched city', () => {
    const msg = buildEndAlertMessage(['Haifa'], 'en');
    expect(msg).toContain('Haifa');
  });

  it('Hebrew: signals all-clear', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he');
    expect(msg).toMatch(/הסתיים|לצאת/);
  });

  it('English: signals all-clear', () => {
    const msg = buildEndAlertMessage(['Tel Aviv'], 'en');
    expect(msg).toMatch(/ended|leave/i);
  });

  it('Hebrew: includes duration when durationMs provided', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he', 5 * 60_000);
    expect(msg).toContain('5');
    expect(msg).toContain('ממ"ד');
  });

  it('English: includes duration when durationMs provided', () => {
    const msg = buildEndAlertMessage(['Tel Aviv'], 'en', 3 * 60_000);
    expect(msg).toContain('3');
    expect(msg).toContain('shelter');
  });

  it('does not include duration line when durationMs is absent', () => {
    const msg = buildEndAlertMessage(['תל אביב'], 'he');
    expect(msg).not.toContain('⏱️');
  });
});

// ---------------------------------------------------------------------------
// buildNewsFlashMessage
// ---------------------------------------------------------------------------

describe('buildNewsFlashMessage', () => {
  it('Hebrew: contains advance notice header', () => {
    const msg = buildNewsFlashMessage(['תל אביב'], 'he');
    expect(msg).toContain('הודעה מקדימה');
  });

  it('Hebrew: contains city name', () => {
    const msg = buildNewsFlashMessage(['חיפה'], 'he');
    expect(msg).toContain('חיפה');
  });

  it('English: contains advance notice header', () => {
    const msg = buildNewsFlashMessage(['Tel Aviv'], 'en');
    expect(msg).toContain('Advance Notice');
  });

  it('English: contains city name', () => {
    const msg = buildNewsFlashMessage(['Haifa'], 'en');
    expect(msg).toContain('Haifa');
  });

  it('he/en messages are different', () => {
    expect(buildNewsFlashMessage(['city'], 'he')).not.toBe(buildNewsFlashMessage(['city'], 'en'));
  });
});

// ---------------------------------------------------------------------------
// getRandomActivity
// ---------------------------------------------------------------------------

describe('getRandomActivity', () => {
  it('returns a non-empty string', () => {
    expect(getRandomActivity().length).toBeGreaterThan(0);
  });

  it('returns different values across multiple calls (probabilistic)', () => {
    const results = new Set(Array.from({ length: 30 }, () => getRandomActivity()));
    expect(results.size).toBeGreaterThan(1);
  });
});
