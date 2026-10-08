import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';
import { HttpFailure } from '../../src/api/transport.ts';

// At most 4 GETs touch the rate-limited /threads list: one in the setup test,
// three in the filter probes. 11s between each keeps us under 6/60s.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Setup = { appId: string | null; staffUserId: string | null };
const setup: Setup = { appId: null, staffUserId: null };

test.describe.serial('Helpdesk threads filters (deep)', () => {
  test('resolves first copilot app and first staff user for filter probes @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    setup.appId = apps.length ? String(apps[0].id) : null;
    try {
      const statuses = await api.agentUsers.listStatuses();
      const map = (statuses.statuses && typeof statuses.statuses === 'object')
        ? statuses.statuses as Record<string, unknown> : null;
      const firstId = map ? Object.keys(map)[0] : null;
      setup.staffUserId = firstId ?? null;
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 403 || error.status === 404)) {
        setup.staffUserId = null;
      } else {
        throw error;
      }
    }
  });

  test('filter by surface=web returns a valid page @api', async ({ api }) => {
    const page = await api.helpdesk.listBySurface(['web'], 5);
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    await sleep(SLEEP_MS);
  });

  test('filter by copilotAppIds returns a valid page @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No copilot app available to filter by.');
    const page = await api.helpdesk.listByCopilotApp([setup.appId as string], 5);
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    await sleep(SLEEP_MS);
  });

  test('filter by staffUserIds returns a valid page @api', async ({ api }) => {
    if (!setup.staffUserId) test.skip(true, 'No staff user available to filter by.');
    const page = await api.helpdesk.listByAssignee([setup.staffUserId as string], 5);
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
  });
});
