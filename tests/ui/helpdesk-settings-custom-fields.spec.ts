import { test } from '../../src/fixtures/helpdesk.ts';

// Trinity's closest equivalent to the brief's "custom-fields" is Contact Fields at /settings/contact-fields
// (trinity/src/pages/Helpdesk/Settings/index.js:399). The route exists in source, so no skip-if-404 guard.
test('Contact Fields settings loads for authenticated session @ui', async ({ customFieldsPage }) => {
  await customFieldsPage.goto();
  await customFieldsPage.expectLoaded();
});
