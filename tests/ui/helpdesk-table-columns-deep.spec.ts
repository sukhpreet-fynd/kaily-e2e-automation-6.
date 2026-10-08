import { test } from '../../src/fixtures/helpdesk.ts';

// Switches to table view and asserts the expected react-table column headers render.
// Headers are derived from trinity/src/pages/Helpdesk/Threads/Views/TableView.js:182-290.
test('Helpdesk table view renders the expected columns @ui', async ({ helpdeskPage }) => {
  await helpdeskPage.switchToTableView();
  await helpdeskPage.assertLoaded();
  await helpdeskPage.assertTableColumns();
});
