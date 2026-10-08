import { chromium, type Request } from '@playwright/test';
import { mkdir, writeFile, chmod, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { stdout } from 'node:process';
import { coreConfig, APPROVED_ORG } from '../src/config/env.ts';
import { installOrganizationGuard } from '../src/auth/scope.ts';

const BEARER_PATH = resolve('.auth/bearer');

async function writeBearerAtomically(token: string): Promise<void> {
  const directory = dirname(BEARER_PATH);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporary = join(directory, `.bearer-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, token, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporary, BEARER_PATH);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

function tokenFromRequest(req: Request): string | null {
  const url = req.url();
  // Only accept bearers from the account-scoped Neo API for the approved org.
  if (!/\/v1\/org\/[^/]+\//.test(url)) return null;
  if (!url.includes(APPROVED_ORG)) return null;
  const authorization = req.headers()['authorization'] || req.headers()['Authorization'];
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9._\-+/=]+)$/);
  return match ? match[1] : null;
}

async function main(): Promise<void> {
  const config = coreConfig();
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      storageState: config.authFile,
      serviceWorkers: 'block',
      timezoneId: config.timezone,
      locale: 'en-US',
    });
    await installOrganizationGuard(context);
    const page = await context.newPage();

    const captured = new Promise<string>((resolveToken, rejectToken) => {
      const timer = setTimeout(() => rejectToken(new Error('timed out waiting for a Bearer token')), 120_000);
      context.on('request', req => {
        const token = tokenFromRequest(req);
        if (!token) return;
        clearTimeout(timer);
        resolveToken(token);
      });
    });

    await page.goto(`${config.baseURL}helpdesk`, { waitUntil: 'domcontentloaded' });
    const token = await captured;
    await writeBearerAtomically(token);
    stdout.write('Bearer captured\n');
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  // Never print the token or raw headers.
  console.error(`capture-bearer failed: ${message}`);
  process.exitCode = 1;
});
