import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// Copilot app list shape contract. Trinity app chooser renders id, name,
// account scope and active toggle; a missing `active` boolean collapses the
// enable/disable UI into an uncontrolled component.
function fail (field: string, reason: string): never {
  throw new Error(`contract: copilotapps[*].${field} ${reason}`);
}

test.describe.serial('Contract: copilot apps list', () => {
  test('each app carries id, name, accountId, active @contract', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 10 });
    expect(Array.isArray(apps)).toBe(true);
    if (!apps.length) test.skip(true, 'No copilot apps provisioned.');

    for (const app of apps) {
      if (typeof app.id !== 'string' || !app.id.length) fail('id', 'must be a non-empty string');
      if (typeof app.name !== 'string' || !app.name.length) fail('name', 'must be a non-empty string');
      if (app.accountId !== APPROVED_ORG) fail('accountId', `must equal APPROVED_ORG (${APPROVED_ORG})`);
      if (typeof app.active !== 'boolean') fail('active', 'must be a boolean');
    }
  });
});
