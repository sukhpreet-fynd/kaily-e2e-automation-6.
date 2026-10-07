import { chromium } from '@playwright/test';
import { stdout } from 'node:process';
import { coreConfig } from '../src/config/env.ts';
import { installOrganizationGuard } from '../src/auth/scope.ts';
import { manualLogin } from '../src/auth/enter-kaily.ts';
import { saveAuthState } from '../src/auth/state.ts';
import { AuthenticationRequiredError } from '../src/auth/session-guard.ts';

let stage = 'starting the headed browser';

async function main() {
  const config = coreConfig();
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block', timezoneId: config.timezone, locale: 'en-US' });
    await installOrganizationGuard(context);
    const page = await context.newPage();
    stdout.write('Enter your email, password and Google Authenticator OTP manually in the browser. Waiting up to 10 minutes; credentials are not recorded. The dashboard will open automatically after sign-in.\n');
    await manualLogin(page, phase => { stage = phase; stdout.write(`Authentication setup: ${phase}.\n`); });
    stage = 'saving authenticated state';
    await saveAuthState(await context.storageState());
    stdout.write('Kaily dashboard loaded. Saved .auth/user.json for all Helpdesk tests.\n');
  } finally { await browser.close(); }
}
main().catch(error => {
  const networkCode = error instanceof Error ? error.message.match(/net::ERR_[A-Z_]+/)?.[0] : undefined;
  const category = networkCode || (error?.name === 'TimeoutError' ? 'timed out' :
    error instanceof Error && /has been closed/.test(error.message) ? 'browser or page was closed' : 'step failed');
  console.error(error instanceof AuthenticationRequiredError ? error.message :
    `Authentication setup stopped while ${stage}: ${category}. Retry npm run auth:setup. No new state was saved.`);
  process.exitCode = 1;
});
