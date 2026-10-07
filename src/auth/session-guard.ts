import type { Page, Response, Frame } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class AuthenticationRequiredError extends Error {
  constructor(reason = 'Saved authentication is missing or expired.') {
    super(`${reason} Run npm run auth:setup again and complete email, password and Google Authenticator OTP manually.`);
    this.name = 'AuthenticationRequiredError';
  }
}

export function isLoginResponse(rawUrl: string, kind: 'session' | 'account', orgId: string) {
  const path = new URL(rawUrl).pathname;
  return kind === 'session' ? path.endsWith('/v1.0/session') : path.endsWith(`/token/${orgId}`);
}

export function isSignInUrl(rawUrl: string) {
  return /\/auth\/(?:login|sign-in)\/?$/.test(new URL(rawUrl).pathname);
}

// A revoked session may still have unexpired cookies. Validate server responses
// and redirects instead of guessing validity from cookie expiry timestamps.
export async function withSessionGuard<T>(page: Page, action: () => Promise<T>): Promise<T> {
  const { orgId } = coreConfig();
  let rejectExpired!: (reason: Error) => void;
  const expired = new Promise<never>((_resolve, reject) => { rejectExpired = reject; });
  const onResponse = (response: Response) => {
    const url = response.url();
    const accountPath = new URL(url).pathname.includes(`/v1/org/${orgId}/`);
    if (response.status() === 401 && (accountPath || isLoginResponse(url, 'session', orgId) || isLoginResponse(url, 'account', orgId))) {
      rejectExpired(new AuthenticationRequiredError());
    }
  };
  const onNavigation = (frame: Frame) => {
    if (frame === page.mainFrame() && isSignInUrl(frame.url())) {
      rejectExpired(new AuthenticationRequiredError('Kaily redirected the saved session to sign-in.'));
    }
  };
  page.on('response', onResponse);
  page.on('framenavigated', onNavigation);
  try {
    return await Promise.race([action(), expired]);
  } finally {
    page.off('response', onResponse);
    page.off('framenavigated', onNavigation);
  }
}
