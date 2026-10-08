// k6 shared config. Reads env vars at module load; throws cleanly if the
// caller forgot something required. Never log the bearer.
// Keep the k6 allowlist in sync with src/config/env.ts. k6 cannot import TS,
// so these are duplicated as plain constants.
const APPROVED_ORGS = {
  prod: 'e6af7bff-e89d-467b-9efe-69a2c9ad0957',
  uat: '1e31f28f-f6bd-45b6-995d-fd02076d6d78',
};

function need(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required env var ${name}. ` +
      `Export it before running k6 (e.g. export ${name}=...).`
    );
  }
  return String(value).trim();
}

const baseUrl = need('K6_BASE_URL', __ENV.K6_BASE_URL).replace(/\/$/, '');
const envName = ((__ENV.K6_ENV && __ENV.K6_ENV.trim()) || 'prod').toLowerCase();
const defaultOrg = APPROVED_ORGS[envName];
if (!defaultOrg) throw new Error(`K6_ENV must be one of ${Object.keys(APPROVED_ORGS).join(', ')}.`);
const orgId = (__ENV.K6_ORG_ID && __ENV.K6_ORG_ID.trim()) || defaultOrg;
if (orgId !== defaultOrg) throw new Error('K6_ORG_ID does not match K6_ENV; refusing to proceed outside authorized scope.');
const profile = (__ENV.K6_PROFILE && __ENV.K6_PROFILE.trim()) || 'smoke';

// Bearer is only required for account-scoped scenarios. Health scenario
// imports this file but doesn't dereference `headers`.
const bearer = __ENV.K6_BEARER ? String(__ENV.K6_BEARER).trim() : '';

const headers = bearer
  ? { authorization: `Bearer ${bearer}`, accept: 'application/json' }
  : { accept: 'application/json' };

export function requireBearer() {
  if (!bearer) {
    throw new Error(
      'Missing K6_BEARER. Run `npm run load:bearer` then ' +
      '`export K6_BEARER=$(cat .auth/bearer)`.'
    );
  }
}

export { baseUrl, orgId, headers, profile };
