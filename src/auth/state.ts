import { readFile, mkdir, writeFile, rename, chmod, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';
import { coreConfig } from '../config/env.ts';
import { AuthenticationRequiredError } from './session-guard.ts';

export type AuthState = Awaited<ReturnType<BrowserContext['storageState']>>;

export async function requireAuthState(path = coreConfig().authFile): Promise<AuthState> {
  let state;
  try { state = JSON.parse(await readFile(path, 'utf8')); }
  catch { throw new AuthenticationRequiredError('Saved authentication is missing or unreadable.'); }
  if (!state || !Array.isArray(state.cookies) || !Array.isArray(state.origins) ||
      (!state.cookies.length && !state.origins.length) ||
      state.cookies.some((cookie: Record<string, unknown>) => !cookie || typeof cookie.name !== 'string' || typeof cookie.value !== 'string') ||
      state.origins.some((origin: Record<string, unknown>) => !origin || typeof origin.origin !== 'string' || !Array.isArray(origin.localStorage))) {
    throw new AuthenticationRequiredError('Saved authentication is empty or invalid.');
  }
  return state as AuthState;
}

export async function saveAuthState(state: AuthState, path = coreConfig().authFile) {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporary = join(directory, `.user-${randomUUID()}.tmp`);
  try {
    // Owner-only permissions from the first write; replace the prior state only
    // after successful dashboard validation and a complete write.
    await writeFile(temporary, JSON.stringify(state), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

// Playwright runs this before constructing contexts with storageState. This
// replaces an opaque ENOENT/JSON error with the exact recovery command.
export default async function checkSavedAuthentication() {
  await requireAuthState();
}
