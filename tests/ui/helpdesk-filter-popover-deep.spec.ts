import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Opens the filter popover and asserts the key filter sections are rendered inside.
// Popover panel: data-testid="filter-popover-panel"
// (trinity/src/pages/Helpdesk/components/FilterPopover.js:194). Section labels come
// from helpdeskFilterCategories at trinity/src/pages/Helpdesk/Threads/index.js:977-990:
// Channels, AI Agents, Group, Assignee, Status, Priority (desktop).
test('Helpdesk filter popover exposes Status, Priority, and Channels controls @ui', async ({ helpdeskPage, page }) => {
  await helpdeskPage.switchToTableView();
  await helpdeskPage.assertLoaded();
  await helpdeskPage.openFiltersPanel();
  const panel = page.getByTestId('filter-popover-panel');
  await expect(panel).toBeVisible();
  for (const label of ['Status', 'Priority', 'Channels']) {
    await expect(panel.getByText(label, { exact: true }).first()).toBeVisible();
  }
});
