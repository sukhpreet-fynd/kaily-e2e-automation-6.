import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Advances the thread list by one page via the AdvancedPagination next-page button
// (trinity/src/common/components/AdvancedPagination.js:145-152). If the list only has
// a single page, the test soft-skips rather than failing.
test('Helpdesk pagination advances to the next page when available @ui', async ({ helpdeskPage }) => {
  await helpdeskPage.switchToTableView();
  await helpdeskPage.assertLoaded();
  const firstBefore = await helpdeskPage.firstRowId();
  expect(firstBefore, 'at least one thread row must render').not.toBeNull();
  const advanced = await helpdeskPage.paginate();
  test.skip(!advanced, 'Only one page of threads available in this environment');
  await expect(helpdeskPage.threadRows().first()).toBeVisible();
  const firstAfter = await helpdeskPage.firstRowId();
  expect(firstAfter).not.toBeNull();
  expect(firstAfter).not.toEqual(firstBefore);
});
