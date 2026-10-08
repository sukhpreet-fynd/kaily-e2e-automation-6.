import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Settings API', () => {
  test('GET settings @api', async ({ api }) => {
    try {
      const settings = await api.settings.getSettings();
      expect(typeof settings).toBe('object');
      if (settings.accountId != null) expect(settings.accountId).toBe(APPROVED_ORG);
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 404) test.skip(true, 'Settings endpoint returned 404.');
      throw error;
    }
  });

  test('GET ticket-id-format @api', async ({ api }) => {
    try {
      const format = await api.settings.getTicketIdFormat();
      expect(typeof format).toBe('object');
      if (format.accountId != null) expect(format.accountId).toBe(APPROVED_ORG);
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 404) test.skip(true, 'ticket-id-format endpoint returned 404.');
      throw error;
    }
  });
});
