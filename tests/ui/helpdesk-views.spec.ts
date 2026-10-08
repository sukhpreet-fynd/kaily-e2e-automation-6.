import { expect, test } from '../../src/fixtures/helpdesk.ts';

test('Helpdesk switches between table and card views @ui', async ({ helpdeskPage, page }) => {
  await helpdeskPage.switchToTableView();
  await helpdeskPage.assertLoaded();
  await helpdeskPage.switchToCardView();
  // Card view does not render table column headers; assert the card list wrapper and the absence of them.
  await helpdeskPage.assertCardViewLoaded();
  await expect(page.getByRole('columnheader', { name: 'Thread ID', exact: true })).toHaveCount(0);
});
