// k6 scenario profiles. Keep baseline well under documented Neo rate limits:
//   /v1/org/{accountId}/threads list: 6 req / 60s per account
//   POST /copilotapps: 1 req / 5s per account (we never POST under load)
//   /generate-content root: 3 req / 60s per IP (we never hit under load)
// Stress is OPT-IN and must never run against prod without approval.

export const smoke = {
  vus: 1,
  duration: '30s',
};

export const baseline = {
  vus: 5,
  duration: '2m',
};

// WARNING: stress profile intentionally exceeds casual safety margins.
// Only run against UAT. Never against prod without written approval.
// Scenarios that touch rate-limited endpoints must still enforce per-VU
// sleep floors so cumulative call rate stays legal.
export const stress = {
  vus: 10,
  duration: '5m',
};

// health-soak: 20 VUs for 5m, exclusively for health-concurrent.js.
// Safe because `_healthz` is unauthenticated, idempotent, and designed for
// liveness probes — the service treats it as a cheap no-op. Any other
// endpoint must NOT use this profile; account-scoped routes share rate
// buckets and WILL trip Neo's limits (threads 6/60s, generate 3/60s per IP).
export const healthSoak = {
  vus: 20,
  duration: '5m',
};

export function pick(name) {
  if (name === 'baseline') return baseline;
  if (name === 'stress') return stress;
  if (name === 'health-soak') return healthSoak;
  return smoke;
}
