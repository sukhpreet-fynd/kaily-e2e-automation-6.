import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Agent users API', () => {
  test('GET statuses @api', async ({ api }) => {
    const body = await api.agentUsers.listStatuses();
    expect(typeof body).toBe('object');
  });

  test('GET my status @api', async ({ api }) => {
    try {
      const me = await api.agentUsers.getMyStatus();
      expect(typeof me).toBe('object');
      if (me.accountId != null) expect(me.accountId).toBe(APPROVED_ORG);
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 404) test.skip(true, 'No agent user record for this operator yet.');
      throw error;
    }
  });
});
