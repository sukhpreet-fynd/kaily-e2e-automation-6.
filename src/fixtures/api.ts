import { test as base, expect } from '@playwright/test';
import { installOrganizationGuard } from '../auth/scope.ts';
import { openApiSession } from '../auth/agent-session.ts';
import type { ApiClients } from '../api/client-factory.ts';

export const test = base.extend<{ api: ApiClients }>({
  context: async ({ context }, use) => { await installOrganizationGuard(context); await use(context); },
  api: async ({ page }, use) => { await use(await openApiSession(page)); },
});
export { expect };
