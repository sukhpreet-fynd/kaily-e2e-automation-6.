import { config as dotenv } from 'dotenv';
import { resolve } from 'node:path';

dotenv({ quiet: true });

export type Environment = Record<string, string | undefined>;
export type EnvName = 'prod' | 'uat';

type EnvTuple = { orgId: string; baseURL: string; mainBase: string; apiOrigins: readonly string[] };

// Allowlist. New environments go here, not in code paths. Each tuple is a signed-off binding
// of {console base URL, org id, API base URL, allowed API origins} — the suite refuses to
// talk to any combination outside this table.
const APPROVED: Record<EnvName, EnvTuple> = {
  prod: {
    orgId: 'e6af7bff-e89d-467b-9efe-69a2c9ad0957',
    baseURL: 'https://console.fynd.com/kaily/asia-south1/',
    mainBase: '',  // filled from env to avoid baking a prod API host in source
    apiOrigins: [],
  },
  uat: {
    orgId: '1e31f28f-f6bd-45b6-995d-fd02076d6d78',
    baseURL: 'https://console.uat.fyndx1.de/kaily/asia-south1/',
    mainBase: 'https://api.kaily.uat.fyndx1.de/asia-south1/service/panel/console',
    apiOrigins: ['https://api.kaily.uat.fyndx1.de'],
  },
};

export const APPROVED_ENVS = Object.keys(APPROVED) as readonly EnvName[];
// Back-compat: downstream code and tests still read APPROVED_ORG. Resolves to the active env's org.
export const APPROVED_ORG = resolveEnv().orgId;
export const APPROVED_BASE = resolveEnv().baseURL;

function required(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; see .env.example.`);
  return value;
}

function apiBase(value: string, origins: readonly string[]): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid API base URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !origins.includes(url.origin)) throw new Error('API base must use HTTPS and an explicitly approved API origin.');
  return url.href.replace(/\/$/, '');
}

function resolveEnv(env: Environment = process.env): EnvTuple {
  const name = (env.KAILY_ENV || 'prod').trim().toLowerCase() as EnvName;
  const tuple = APPROVED[name];
  if (!tuple) throw new Error(`KAILY_ENV must be one of ${APPROVED_ENVS.join(', ')}.`);
  return tuple;
}

export function coreConfig(env: Environment = process.env) {
  const tuple = resolveEnv(env);
  if (env.KAILY_ORG_ID && env.KAILY_ORG_ID !== tuple.orgId) {
    throw new Error('KAILY_ORG_ID does not match the selected KAILY_ENV; refusing to proceed outside authorized scope.');
  }
  if (env.KAILY_BASE_URL && env.KAILY_BASE_URL !== tuple.baseURL) {
    throw new Error('KAILY_BASE_URL does not match the selected KAILY_ENV; refusing to proceed outside authorized scope.');
  }
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
  return { orgId: tuple.orgId, baseURL: tuple.baseURL, authFile, pollTimeout, timezone };
}

export function apiConfig(env: Environment = process.env) {
  const tuple = resolveEnv(env);
  // Each env may hardcode its API base + origins (uat does). Prod intentionally reads from env
  // so the API gateway is never baked into source; both are validated against the allowlist.
  const origins = tuple.apiOrigins.length
    ? [...tuple.apiOrigins]
    : required(env, 'KAILY_API_ORIGINS').split(',').map(s => s.trim());
  const base = tuple.mainBase || required(env, 'KAILY_MAIN_API_BASE_URL');
  return { ...coreConfig(env), mainBase: apiBase(base, origins) };
}

export function inboundConfig(env: Environment = process.env) {
  const base = apiConfig(env);
  if (env.KAILY_ENABLE_INBOUND !== 'true' || env.KAILY_SIDE_EFFECTS_ISOLATED !== 'true') {
    throw new Error('Inbound writes require explicit enablement and confirmed side-effect isolation.');
  }
  const tuple = resolveEnv(env);
  const origins = tuple.apiOrigins.length
    ? [...tuple.apiOrigins]
    : required(env, 'KAILY_API_ORIGINS').split(',').map(s => s.trim());
  return {
    ...base,
    appId: required(env, 'KAILY_COPILOT_APP_ID'),
    integrationId: required(env, 'KAILY_INTEGRATION_ID'),
    integrationToken: required(env, 'KAILY_INTEGRATION_TOKEN'),
    integrationBase: apiBase(required(env, 'KAILY_INTEGRATIONS_API_BASE_URL'), origins),
  };
}
