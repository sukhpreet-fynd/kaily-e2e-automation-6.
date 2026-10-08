import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Copilot apps API', () => {
  test('lists copilot apps @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 10 });
    expect(Array.isArray(apps)).toBe(true);
    for (const app of apps) {
      expect(typeof app.id).toBe('string');
      if (app.accountId != null) expect(app.accountId).toBe(APPROVED_ORG);
    }
  });

  test('fetches app detail, stats and surfaces @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    if (!apps.length) test.skip(true, 'No copilot apps provisioned.');
    const id = String(apps[0].id);
    const detail = await api.agents.getCopilotApp(id);
    expect(detail.id).toBe(id);
    if (detail.accountId != null) expect(detail.accountId).toBe(APPROVED_ORG);
    const stats = await api.agents.getAgentStats(id);
    expect(typeof stats).toBe('object');
    const surfaces = await api.agents.listAgentSurfaces(id);
    expect(typeof surfaces).toBe('object');
  });
});
