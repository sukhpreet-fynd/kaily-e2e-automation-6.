import { errors, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';
import { AuthenticationRequiredError, isLoginResponse, withSessionGuard } from './session-guard.ts';
export { isLoginResponse } from './session-guard.ts';

// Source: Trinity AuthGuard -> Sage /v1.0/session; OrganizationGuard ->
// Fennel /token/:orgId. Authentication must not depend on Helpdesk's layout.
export async function enterKaily(page: Page) {
  return withSessionGuard(page, () => loadDashboard(page));
}

async function loadDashboard(page: Page) {
  const config = coreConfig();
  const timeout = 30_000;
  const session = page.waitForResponse(response =>
    response.request().method() === 'GET' && isLoginResponse(response.url(), 'session', config.orgId), { timeout });
  const account = page.waitForResponse(response =>
    response.request().method() === 'GET' && isLoginResponse(response.url(), 'account', config.orgId), { timeout });
  const verifySession = async () => {
    const response = await session;
    if (response.status() === 401) throw new AuthenticationRequiredError();
    if (response.status() !== 200) throw new Error('Session service is unavailable; response contents omitted.');
    let body;
    try { body = await response.json(); } catch { throw new Error('Unexpected session response; contents omitted.'); }
    if (!body?.user || typeof body.user !== 'object') throw new AuthenticationRequiredError('Authenticated user was not returned.');
  };
  const verifyAccount = async () => {
    const response = await account;
    if (response.status() === 401) throw new AuthenticationRequiredError();
    if (response.status() !== 200) throw new Error('Access to the approved Kaily organization failed; check account membership.');
    let body;
    try { body = await response.json(); } catch { throw new Error('Unexpected account response; contents omitted.'); }
    if (typeof body?.data?.token !== 'string' || !body.data.token) throw new AuthenticationRequiredError('Account authorization was not returned.');
  };
  await Promise.all([
    verifySession(), verifyAccount(),
    page.goto(`${config.baseURL}accounts/${config.orgId}/dashboard`, { waitUntil: 'domcontentloaded' }),
  ]);
  await page.waitForURL(url => url.origin === new URL(config.baseURL).origin &&
    url.pathname.replace(/\/$/, '') === `/kaily/asia-south1/accounts/${config.orgId}/dashboard`, { timeout });
  // Source: trinity/src/pages/Home/index.js, _ComponentHeader subtitle.
  await page.getByText('See overview of all your stats here', { exact: true }).waitFor({ state: 'visible', timeout });
}

export async function manualLogin(page: Page, progress: (phase: string) => void = () => {}) {
  const config = coreConfig();
  // Start listening before navigation so a fast SSO callback cannot be missed.
  const signedIn = page.waitForResponse(response => response.request().method() === 'GET' &&
    response.status() === 200 && isLoginResponse(response.url(), 'session', config.orgId), { timeout: 600_000 });
  progress('opening the login page');
  const navigate = page.goto(`${config.baseURL}auth/login`, { waitUntil: 'commit', timeout: 30_000 }).catch(error => {
    // Redirects/slow document loading must not shorten the manual MFA window.
    // A failed network request or a closed browser is still a real failure.
    if (!(error instanceof errors.TimeoutError) || page.isClosed()) throw error;
    progress('waiting for manual sign-in after a slow navigation');
  });
  const [response] = await Promise.all([
    signedIn,
    navigate,
  ]);
  let body;
  try { body = await response.json(); } catch { throw new AuthenticationRequiredError('Login did not return a valid session.'); }
  if (!body?.user || typeof body.user !== 'object') throw new AuthenticationRequiredError('Login did not return an authenticated user.');
  // Email, password and Google Authenticator OTP are entered only by the user.
  // Once SSO has completed, select the authorized account automatically.
  progress('verifying the authenticated Kaily dashboard');
  await enterKaily(page);
}
