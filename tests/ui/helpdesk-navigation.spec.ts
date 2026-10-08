import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Walks each helpdesk settings route in sequence and asserts the landmark for each page. Uses direct
// navigation rather than sidebar clicks: trinity's sidebar only links to /settings (the hub), and the
// in-page sub-navigation triggers side-effectful <IconAction> onClicks that we do not want to replay here.
test('Helpdesk settings sub-pages load end-to-end @ui', async ({
  page, groupsPage, businessHoursPage, ticketStatusesPage, customFieldsPage, routingRulesPage, inboxNotificationsPage,
}) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  await groupsPage.goto(); await groupsPage.expectLoaded();
  await businessHoursPage.goto(); await businessHoursPage.expectLoaded();
  await ticketStatusesPage.goto(); await ticketStatusesPage.expectLoaded();
  await customFieldsPage.goto(); await customFieldsPage.expectLoaded();
  await routingRulesPage.goto(); await routingRulesPage.expectLoaded();
  await inboxNotificationsPage.goto(); await inboxNotificationsPage.expectLoaded();
  expect(errors, errors.map(e => e.message).join('\n')).toHaveLength(0);
});
