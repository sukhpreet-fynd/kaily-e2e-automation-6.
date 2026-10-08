import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Helpdesk thread messages API', () => {
  test('lists messages for first thread of first copilot app @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    if (!apps.length) test.skip(true, 'No copilot apps provisioned.');
    const appId = String(apps[0].id);

    const page = await api.helpdesk.listThreadsFiltered({ copilotAppIds: [appId], limit: 1 });
    if (!page.items.length) test.skip(true, 'No threads for this app; cannot assert messages.');
    const threadId = String(page.items[0].id);

    const messages = await api.helpdesk.messages(appId, threadId);
    expect(Array.isArray(messages)).toBe(true);
    for (const message of messages) {
      expect(typeof message.id).toBe('string');
      if (message.accountId != null) expect(message.accountId).toBe(APPROVED_ORG);
    }
  });
});
