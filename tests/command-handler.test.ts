/**
 * Tests for command-handler — focused on handleGroupJoin (added in this PR).
 */

// ---- Module mocks (must be before imports) --------------------------------

jest.mock('../src/config', () => require('./__mocks__/config'));

jest.mock('../src/utils/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

// Stub Supabase so we don't need a real DB connection
jest.mock('../src/services/supabase', () => ({
  getConversationHistory: jest.fn().mockResolvedValue([]),
  saveMessage: jest.fn().mockResolvedValue(undefined),
}));

// Stub AI service
jest.mock('../src/services/ai', () => ({
  isAIEnabled: jest.fn().mockReturnValue(false),
  askAI: jest.fn().mockResolvedValue('ok'),
}));

// Stub city database (reads a JSON file — avoid FS side-effects)
jest.mock('../src/core/city-database', () => ({
  searchCities: jest.fn().mockReturnValue([]),
  findCity: jest.fn().mockReturnValue(null),
  getCityCount: jest.fn().mockReturnValue(1449),
}));

// Capture sendGroupMessage calls
const mockSendGroupMessage = jest.fn().mockResolvedValue(true);
const mockReactToMessage = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/services/whatsapp', () => ({
  sendGroupMessage: (...args: unknown[]) => mockSendGroupMessage(...args),
  isWhatsAppConnected: jest.fn().mockReturnValue(true),
  getPendingMessageCount: jest.fn().mockReturnValue(0),
  getBotJid: jest.fn().mockReturnValue('972501234567@s.whatsapp.net'),
  getBotLid: jest.fn().mockReturnValue(undefined),
  reactToMessage: (...args: unknown[]) => mockReactToMessage(...args),
}));

// Capture group-config calls
const mockGetGroupConfig = jest.fn();
const mockApproveGroup = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/core/group-config', () => ({
  getGroupConfig: (...args: unknown[]) => mockGetGroupConfig(...args),
  approveGroup: (...args: unknown[]) => mockApproveGroup(...args),
  addCities: jest.fn().mockResolvedValue([]),
  removeCities: jest.fn().mockResolvedValue([]),
  clearCities: jest.fn().mockResolvedValue(undefined),
  setLanguage: jest.fn().mockResolvedValue(undefined),
  setStreakEnabled: jest.fn().mockResolvedValue(undefined),
  setActivitiesEnabled: jest.fn().mockResolvedValue(undefined),
  getAllConfigs: jest.fn().mockReturnValue([]),
}));

// ---- Imports --------------------------------------------------------------

import { handleGroupJoin } from '../src/core/command-handler';
import { msgWelcome } from '../src/utils/messages';

// ---- Tests ----------------------------------------------------------------

const GROUP_ID = 'test-group-123@g.us';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('handleGroupJoin', () => {
  describe('new group (no existing config)', () => {
    beforeEach(() => {
      // First call returns null (no config yet),
      // second call (after approveGroup) returns a fresh Hebrew config
      mockGetGroupConfig
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ language: 'he', cities: [], settings: {} });
    });

    it('calls approveGroup to create the group record', async () => {
      await handleGroupJoin(GROUP_ID);
      expect(mockApproveGroup).toHaveBeenCalledWith(GROUP_ID);
      expect(mockApproveGroup).toHaveBeenCalledTimes(1);
    });

    it('sends the Hebrew welcome message', async () => {
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledWith(
        GROUP_ID,
        msgWelcome('he')
      );
    });

    it('sends exactly one message', async () => {
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('existing group (config already present)', () => {
    beforeEach(() => {
      mockGetGroupConfig.mockReturnValue({ language: 'he', cities: ['תל אביב'], settings: {} });
    });

    it('does NOT call approveGroup again', async () => {
      await handleGroupJoin(GROUP_ID);
      expect(mockApproveGroup).not.toHaveBeenCalled();
    });

    it('still sends a welcome message', async () => {
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('language detection', () => {
    it('sends Hebrew welcome when group language is "he"', async () => {
      mockGetGroupConfig.mockReturnValue({ language: 'he', cities: [], settings: {} });
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledWith(GROUP_ID, msgWelcome('he'));
    });

    it('sends English welcome when group language is "en"', async () => {
      mockGetGroupConfig.mockReturnValue({ language: 'en', cities: [], settings: {} });
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledWith(GROUP_ID, msgWelcome('en'));
    });

    it('defaults to Hebrew when config is null after approveGroup', async () => {
      // Both calls return null (edge case: approveGroup didn't materialise config)
      mockGetGroupConfig.mockReturnValue(null);
      mockApproveGroup.mockResolvedValue(undefined);
      await handleGroupJoin(GROUP_ID);
      expect(mockSendGroupMessage).toHaveBeenCalledWith(GROUP_ID, msgWelcome('he'));
    });
  });
});
