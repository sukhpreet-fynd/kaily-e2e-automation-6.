// Safety note: smoke profile only. /settings is account-scoped and has no
// documented limit, but it is a config read that other requests may touch
// concurrently; the 11s sleep per iteration mirrors the threads-list margin
// so a single VU stays well under any shared bucket. Do not promote above
// smoke without endpoint-level rate-limit sign-off.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

requireBearer();

// Runtime guard: anything other than smoke downgrades. This endpoint is not
// in the stress-safe allowlist (only health-concurrent is).
const chosen = profile === 'smoke' ? 'smoke' : 'smoke';

export const options = {
  ...pick(chosen),
  thresholds: defaultThresholds,
  tags: { scenario: 'settings' },
};

const url = `${baseUrl}/v1/org/${orgId}/settings`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'settings' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  // 11s floor keeps per-VU rate well under any shared account bucket.
  sleep(11);
}
