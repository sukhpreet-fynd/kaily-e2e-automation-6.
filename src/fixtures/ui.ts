import { test as base, expect } from '@playwright/test';
import { installOrganizationGuard } from '../auth/scope.ts';
import { InsightsPage } from '../pages/insights.page.ts';
import { AgentsPage } from '../pages/agents.page.ts';
import { ApiKeysPage } from '../pages/api-keys.page.ts';
import { ContactsPage } from '../pages/contacts.page.ts';
import { TeamsPage } from '../pages/teams.page.ts';

type UiFixtures = {
  insightsPage: InsightsPage;
  agentsPage: AgentsPage;
  apiKeysPage: ApiKeysPage;
  contactsPage: ContactsPage;
  teamsPage: TeamsPage;
};

export const test = base.extend<UiFixtures>({
  context: async ({ context }, use) => { await installOrganizationGuard(context); await use(context); },
  insightsPage: async ({ page }, use) => { await use(new InsightsPage(page)); },
  agentsPage: async ({ page }, use) => { await use(new AgentsPage(page)); },
  apiKeysPage: async ({ page }, use) => { await use(new ApiKeysPage(page)); },
  contactsPage: async ({ page }, use) => { await use(new ContactsPage(page)); },
  teamsPage: async ({ page }, use) => { await use(new TeamsPage(page)); },
});
export { expect };
