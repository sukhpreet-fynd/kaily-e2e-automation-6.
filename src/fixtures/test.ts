import { test as base, expect } from '@playwright/test';
import { installOrganizationGuard } from '../auth/scope.ts';
import { openAgentSession } from '../auth/agent-session.ts';
import { HelpdeskClient } from '../api/helpdesk-client.ts';
import { HelpdeskPage } from '../pages/helpdesk.page.ts';

export const test = base.extend<{ helpdesk: HelpdeskClient; helpdeskPage: HelpdeskPage }>({
  context: async ({ context }, use) => { await installOrganizationGuard(context); await use(context); },
  helpdesk: async ({ page }, use) => { await use(await openAgentSession(page)); },
  helpdeskPage: async ({ page, helpdesk }, use) => { void helpdesk; await use(new HelpdeskPage(page)); },
});
export { expect };
