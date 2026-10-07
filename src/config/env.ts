import { config as dotenv } from 'dotenv';
import { resolve } from 'node:path';

dotenv({ quiet: true });
export const APPROVED_ORG = 'e6af7bff-e89d-467b-9efe-69a2c9ad0957';
export const APPROVED_BASE = 'https://console.fynd.com/kaily/asia-south1/';
export type Environment = Record<string, string | undefined>;

function required(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; see .env.example.`);
  return value;
}

function apiBase(value: string, origins: string[]): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid API base URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !origins.includes(url.origin)) throw new Error('API base must use HTTPS and an explicitly approved API origin.');
  return url.href.replace(/\/$/, '');
}

export function coreConfig(env: Environment = process.env) {
  if ((env.KAILY_ORG_ID || APPROVED_ORG) !== APPROVED_ORG) throw new Error('Organization is outside the authorized scope.');
  if ((env.KAILY_BASE_URL || APPROVED_BASE) !== APPROVED_BASE) throw new Error('Console URL is outside the authorized scope.');
  const authFile = resolve('.auth/user.json');
  if (env.KAILY_AUTH_STATE_PATH && resolve(env.KAILY_AUTH_STATE_PATH) !== authFile) {
    throw new Error('Auth state must use .auth/user.json. Update KAILY_AUTH_STATE_PATH or remove the override.');
  }
  const pollTimeout = Number(env.KAILY_POLL_TIMEOUT_MS || 45_000);
  if (!Number.isInteger(pollTimeout) || pollTimeout < 1000 || pollTimeout > 120_000) {
    throw new Error('Polling timeout must be between 1000 and 120000 milliseconds.');
  }
  const timezone = env.KAILY_TIMEZONE || 'Asia/Kolkata';
  new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  return { orgId: APPROVED_ORG, baseURL: APPROVED_BASE, authFile, pollTimeout, timezone };
}

export function apiConfig(env: Environment = process.env) {
  const origins = required(env, 'KAILY_API_ORIGINS').split(',').map(s => s.trim());
  return { ...coreConfig(env), mainBase: apiBase(required(env, 'KAILY_MAIN_API_BASE_URL'), origins) };
}

export function inboundConfig(env: Environment = process.env) {
  const base = apiConfig(env);
  if (env.KAILY_ENABLE_INBOUND !== 'true' || env.KAILY_SIDE_EFFECTS_ISOLATED !== 'true') {
    throw new Error('Inbound writes require explicit enablement and confirmed side-effect isolation.');
  }
  const origins = required(env, 'KAILY_API_ORIGINS').split(',').map(s => s.trim());
  return {
    ...base,
    appId: required(env, 'KAILY_COPILOT_APP_ID'),
    integrationId: required(env, 'KAILY_INTEGRATION_ID'),
    integrationToken: required(env, 'KAILY_INTEGRATION_TOKEN'),
    integrationBase: apiBase(required(env, 'KAILY_INTEGRATIONS_API_BASE_URL'), origins),
  };
}
