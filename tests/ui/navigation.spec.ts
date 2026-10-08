import { expect, test } from '../../src/fixtures/ui.ts';
import { coreConfig } from '../../src/config/env.ts';
import { HelpdeskPage } from '../../src/pages/helpdesk.page.ts';

test('Navigates insights -> agents -> helpdesk -> contacts without page errors @ui', async ({
  page, insightsPage, agentsPage, contactsPage,
}) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));

  await insightsPage.goto();
  await insightsPage.expectLoaded();

  await agentsPage.goto();
  await agentsPage.expectLoaded();

  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await new HelpdeskPage(page).assertLoaded();

  await contactsPage.goto();
  await contactsPage.expectLoaded();

  expect(errors, errors.map(error => error.message).join('\n')).toHaveLength(0);
});
