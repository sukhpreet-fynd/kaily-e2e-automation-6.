import { chromium } from '@playwright/test';
import { mkdir, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stdout } from 'node:process';
import { coreConfig } from '../src/config/env.ts';
import { installOrganizationGuard } from '../src/auth/scope.ts';

async function main() {
  const config = coreConfig();
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await installOrganizationGuard(context);
    const page = await context.newPage();
    await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`);
    stdout.write('Complete sign-in and the current MFA code in the browser. Open the approved Helpdesk table view. Waiting up to 10 minutes; credentials are not recorded.\n');
    await page.waitForURL(url => url.origin === new URL(config.baseURL).origin &&
      url.pathname === `/kaily/asia-south1/accounts/${config.orgId}/helpdesk`, { timeout: 600_000 });
    // Returning to the URL alone is insufficient: the authenticated table must render.
    await page.getByRole('columnheader', { name: 'Thread ID', exact: true }).waitFor({ state: 'visible', timeout: 600_000 });
    const url = new URL(page.url());
    if (url.origin !== new URL(config.baseURL).origin ||
        !url.pathname.startsWith(`/kaily/asia-south1/accounts/${config.orgId}/helpdesk`)) {
      throw new Error('Approved Helpdesk is not open.');
    }
    await mkdir(dirname(config.authFile), { recursive: true, mode: 0o700 });
    await context.storageState({ path: config.authFile });
    await chmod(config.authFile, 0o600);
    stdout.write('Session saved locally. Session contents were not printed.\n');
  } finally { await browser.close(); }
}
main().catch(() => { console.error('Session capture failed. Complete SSO in the approved account and try again.'); process.exitCode = 1; });
