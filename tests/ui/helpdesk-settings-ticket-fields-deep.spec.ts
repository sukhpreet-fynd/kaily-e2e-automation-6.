import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Ticket Fields page: assert the left-panel field-type palette is mounted
// (data-testid="field-left-panel" at trinity/src/pages/Helpdesk/Settings/TicketFields/index.js:898)
// and that the default Status + Priority ticket fields appear in the field list
// (data-testid="field-list" at trinity/src/pages/Helpdesk/Settings/FieldBuilder/FieldEditorCanvas.js:199).
test('Ticket Fields shows Status and Priority default fields @ui', async ({ ticketStatusesPage, page }) => {
  await ticketStatusesPage.goto();
  await ticketStatusesPage.expectLoaded();
  await expect(page.getByTestId('field-left-panel')).toBeVisible();
  const fieldList = page.getByTestId('field-list');
  await expect(fieldList).toBeVisible();
  await expect(fieldList.getByText('Status', { exact: true }).first()).toBeVisible();
  await expect(fieldList.getByText('Priority', { exact: true }).first()).toBeVisible();
});
