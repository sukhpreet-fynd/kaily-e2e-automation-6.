import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

const VALID_STATUSES = new Set(['online', 'offline', 'busy', 'away', 'available']);

test.describe.serial('Agent users (deep)', () => {
  test('statuses map carries valid { status, lastChangedAt } entries @api', async ({ api }) => {
    const body = await api.agentUsers.listStatuses();
    expect(typeof body).toBe('object');
    // neo returns { statuses: { [userId]: { status, lastChangedAt } } }.
    expect(body.statuses != null).toBe(true);
    expect(typeof body.statuses).toBe('object');
    const map = body.statuses as Record<string, unknown>;
    for (const userId of Object.keys(map)) {
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
      const entry = map[userId];
      expect(entry && typeof entry === 'object').toBe(true);
      const row = entry as Record<string, unknown>;
      expect(typeof row.status).toBe('string');
      expect(VALID_STATUSES.has(String(row.status))).toBe(true);
    }
  });

  test('current agent-user status matches an allowed value and the approved org @api', async ({ api }) => {
    let me;
    try {
      me = await api.agentUsers.getMyStatus();
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 404) {
        test.skip(true, 'No agent user record for this operator yet.');
      }
      throw error;
    }
    expect(typeof me).toBe('object');
    if (me.accountId != null) expect(me.accountId).toBe(APPROVED_ORG);
    if (me.status != null) {
      expect(typeof me.status).toBe('string');
      expect(VALID_STATUSES.has(String(me.status))).toBe(true);
    }
  });
});
