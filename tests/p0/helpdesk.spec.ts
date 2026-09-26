import { test } from '../../src/fixtures/test.ts';
test('Helpdesk loads and thread rows are visible @p0', async ({ helpdesk, helpdeskPage, page }) => {
  await helpdeskPage.assertLoaded();
  const threads = await helpdesk.listThreads();
  if (!threads.length) throw new Error('Helpdesk is empty; provision an approved synthetic fixture before this check.');
  // Do not include existing customer names or message bodies in assertion output.
  await page.getByRole('row').nth(1).waitFor({ state: 'visible' });
});
