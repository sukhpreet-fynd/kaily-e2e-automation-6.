import { test as base, expect } from '@playwright/test';
import { installOrganizationGuard } from '../auth/scope.ts';
import { HelpdeskPage } from '../pages/helpdesk.page.ts';
import { TicketStatusesPage } from '../pages/helpdesk-settings/ticket-statuses.page.ts';
import { GroupsPage } from '../pages/helpdesk-settings/groups.page.ts';
import { BusinessHoursPage } from '../pages/helpdesk-settings/business-hours.page.ts';
import { CustomFieldsPage } from '../pages/helpdesk-settings/custom-fields.page.ts';
import { RoutingRulesPage } from '../pages/helpdesk-settings/routing-rules.page.ts';
import { InboxNotificationsPage } from '../pages/helpdesk-settings/inbox-notifications.page.ts';

type HelpdeskUiFixtures = {
  helpdeskPage: HelpdeskPage;
  ticketStatusesPage: TicketStatusesPage;
  groupsPage: GroupsPage;
  businessHoursPage: BusinessHoursPage;
  customFieldsPage: CustomFieldsPage;
  routingRulesPage: RoutingRulesPage;
  inboxNotificationsPage: InboxNotificationsPage;
};

export const test = base.extend<HelpdeskUiFixtures>({
  context: async ({ context }, use) => { await installOrganizationGuard(context); await use(context); },
  helpdeskPage: async ({ page }, use) => { await use(new HelpdeskPage(page)); },
  ticketStatusesPage: async ({ page }, use) => { await use(new TicketStatusesPage(page)); },
  groupsPage: async ({ page }, use) => { await use(new GroupsPage(page)); },
  businessHoursPage: async ({ page }, use) => { await use(new BusinessHoursPage(page)); },
  customFieldsPage: async ({ page }, use) => { await use(new CustomFieldsPage(page)); },
  routingRulesPage: async ({ page }, use) => { await use(new RoutingRulesPage(page)); },
  inboxNotificationsPage: async ({ page }, use) => { await use(new InboxNotificationsPage(page)); },
});
export { expect };
