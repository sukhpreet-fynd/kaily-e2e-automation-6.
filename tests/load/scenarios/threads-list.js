import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

// GET /v1/org/{accountId}/threads?limit=20
// Rate limit: 6 requests / 60s per account (neo threads.route.js:176-180).
// Math: 60s / 6 = 10s per call minimum. We sleep 11s to leave headroom,
// so each VU does ~5 calls/min. baseline=5 VUs => 25 calls/min, which
// EXCEEDS the per-account cap, so we only run smoke by default. Baseline
// is safe only if the test accounts are distinct per VU, which they are
// not here. Use smoke profile for this scenario.
requireBearer();

export const options = {
  ...pick(profile),
  thresholds: defaultThresholds,
  tags: { scenario: 'threads-list' },
};

const url = `${baseUrl}/v1/org/${orgId}/threads?limit=20`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'threads-list' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  // 11s floor keeps a single VU under 6/60s. Multi-VU still shares the
  // account bucket, so keep this scenario on smoke (1 VU).
  sleep(11);
}
