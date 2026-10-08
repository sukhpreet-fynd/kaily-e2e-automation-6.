import { test } from '../../src/fixtures/helpdesk.ts';

// Trinity exposes ticket statuses as choices of the "Status" ticket-field; the enclosing settings
// screen is Ticket Fields at /settings/ticket-fields (trinity/src/pages/Helpdesk/Settings/index.js:396).
test('Ticket Fields settings loads for authenticated session @ui', async ({ ticketStatusesPage }) => {
  await ticketStatusesPage.goto();
  await ticketStatusesPage.expectLoaded();
});
