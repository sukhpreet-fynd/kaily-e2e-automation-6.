import { test, expect } from '../../src/fixtures/api.ts';

// Message role enum, as found in neo `app/pkg/conversations/`:
//   - 'user'       — end-user sent message
//   - 'assistant'  — AI reply (maps to actorType 'agent' in model.js:126)
//   - 'agent'      — explicit agent sender surfaced on some channels
//   - 'bot'        — automated/system bot responder
//   - 'system'     — internal events (private_note, event_support_enter, summary)
//   - 'support'    — human support agent (model.js:127 deriveMessageActorType)
// Task brief lists {user, assistant, agent, bot, system}; we accept the full
// enum found in source (plus 'support') so a legitimate support message does
// not flip the contract red.
const ALLOWED_ROLES = new Set(['user', 'assistant', 'agent', 'bot', 'system', 'support']);

function fail (field: string, reason: string): never {
  throw new Error(`contract: messages[*].${field} ${reason}`);
}

test.describe.serial('Contract: thread messages', () => {
  test('each message has id, role, content|body, createdAt @contract', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    if (!apps.length) test.skip(true, 'No copilot apps provisioned.');
    const appId = String(apps[0].id);

    const page = await api.helpdesk.listThreadsFiltered({ copilotAppIds: [appId], limit: 1 });
    if (!page.items.length) test.skip(true, 'No threads for this app; cannot assert messages contract.');
    const threadId = String(page.items[0].id);

    const messages = await api.helpdesk.messages(appId, threadId);
    expect(Array.isArray(messages)).toBe(true);

    for (const m of messages) {
      if (typeof m.id !== 'string' || !m.id.length) fail('id', 'must be a non-empty string');
      if (typeof m.role !== 'string' || !ALLOWED_ROLES.has(m.role)) fail('role', `must be one of ${[...ALLOWED_ROLES].join('|')}`);
      const hasContent = typeof m.content === 'string';
      const hasBody = typeof m.body === 'string';
      if (!hasContent && !hasBody) fail('content|body', 'at least one must exist as a string');
      if (typeof m.createdAt !== 'string' || Number.isNaN(Date.parse(m.createdAt))) fail('createdAt', 'must be an ISO date string');
    }
  });
});
