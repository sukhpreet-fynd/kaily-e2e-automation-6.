// Safety note: this is the ONLY scenario cleared for the health-soak profile
// (20 VUs / 5m) and the stress profile. _healthz is unauthenticated,
// idempotent, and explicitly intended for liveness/readiness probing by
// orchestrators — hammering it is the whole point. Stricter thresholds are
// enforced since there is no reason for health to ever be slow or flaky.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, profile } from '../lib/config.js';
import { pick } from '../lib/profiles.js';

// Default to baseline (10 VUs/2m per task brief) if nothing passed. Allow
// stress and health-soak explicitly; everything else falls back to baseline
// so we never accidentally run a 1-VU smoke under a scenario named for load.
function chooseProfile (name) {
  if (name === 'health-soak') return 'health-soak';
  if (name === 'stress') return 'stress';
  if (name === 'smoke') return 'smoke';
  return 'baseline';
}
const chosen = chooseProfile(profile);

// Override baseline here to the brief's 10 VUs / 2m contract if that's what
// the operator picked (brief says baseline for this scenario = 10 VUs / 2m).
const base = pick(chosen);
const options_ = chosen === 'baseline' ? { vus: 10, duration: '2m' } : base;

export const options = {
  ...options_,
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.999'],
  },
  tags: { scenario: 'health-concurrent' },
};

export default function () {
  const res = http.get(`${baseUrl}/_healthz`, { tags: { scenario: 'health-concurrent' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
