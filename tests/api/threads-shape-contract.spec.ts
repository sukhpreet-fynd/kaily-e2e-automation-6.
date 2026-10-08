import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// 2 list GETs across setup + messages: well under the 6/60s thread limit.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ALLOWED_ROLES = new Set(['user', 'assistant', 'agent', 'bot', 'system']);

const requireField = (row: Record<string, unknown>, name: string, type: 'string' | 'number') => {
  const value = row[name];
  if (value == null) throw new Error(`contract: missing required field "${name}"`);
  if (typeof value !== type) throw new Error(`contract: field "${name}" has wrong type (${typeof value}, expected ${type})`);
};

const requireAnyField = (row: Record<string, unknown>, names: string[]) => {
  for (const name of names) {
    const value = row[name];
    if (value != null && (typeof value === 'string' || typeof value === 'number')) return;
  }
  throw new Error(`contract: at least one of [${names.join(', ')}] must be present`);
};

type Setup = { appId: string | null; threadId: string | null };
const setup: Setup = { appId: null, threadId: null };

test.describe.serial('Threads shape contract', () => {
  test('thread detail contains the UI-critical fields @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    setup.appId = apps.length ? String(apps[0].id) : null;
    if (!setup.appId) test.skip(true, 'No copilot apps provisioned.');

    const page = await api.helpdesk.listThreadsFiltered({ copilotAppIds: [setup.appId as string], limit: 1 });
    if (!page.items.length) test.skip(true, 'No threads for this app; cannot assert thread contract.');
    setup.threadId = String(page.items[0].id);

    const detail = await api.helpdesk.thread(setup.threadId);
    requireField(detail, 'id', 'string');
    expect(detail.id).toBe(setup.threadId);
    if (detail.accountId != null) expect(detail.accountId).toBe(APPROVED_ORG);
    requireField(detail, 'status', 'string');
    requireField(detail, 'priority', 'string');
    // UI shows one of subject / displayName / displayId as the title.
    requireAnyField(detail, ['subject', 'displayName', 'displayId']);
    requireAnyField(detail, ['createdAt', 'createdTime']);
    await sleep(SLEEP_MS);
  });

  test('messages carry id, role and content/body + createdAt @api', async ({ api }) => {
    if (!setup.appId || !setup.threadId) test.skip(true, 'Thread setup skipped; cannot assert message contract.');
    const messages = await api.helpdesk.messages(setup.appId as string, setup.threadId as string);
    expect(Array.isArray(messages)).toBe(true);
    if (!messages.length) test.skip(true, 'Thread has no messages; cannot assert message contract.');
    for (const message of messages) {
      requireField(message, 'id', 'string');
      if (message.accountId != null) expect(message.accountId).toBe(APPROVED_ORG);
      if (message.role != null) {
        expect(typeof message.role).toBe('string');
        expect(ALLOWED_ROLES.has(String(message.role))).toBe(true);
      }
      requireAnyField(message, ['content', 'body', 'text', 'message']);
      requireAnyField(message, ['createdAt', 'createdTime', 'timestamp']);
    }
  });
});
