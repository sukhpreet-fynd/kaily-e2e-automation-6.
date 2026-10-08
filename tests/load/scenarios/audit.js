// Safety note: smoke profile only. /audit is admin-gated; a non-admin
// bearer returns 403 which we soft-fail (tag + count only, no abort) so
// the scenario still exits 0 and reports the gate. Never raise above smoke:
// audit queries hit the activity store and are expensive relative to reads.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

requireBearer();

const chosen = profile === 'smoke' ? 'smoke' : 'smoke';
const forbiddenCount = new Counter('audit_forbidden');

export const options = {
  ...pick(chosen),
  thresholds: defaultThresholds,
  tags: { scenario: 'audit' },
};

const url = `${baseUrl}/v1/org/${orgId}/audit?limit=5`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'audit' } });
  if (res.status === 403) {
    forbiddenCount.add(1, { reason: 'not-admin' });
    check(res, { 'audit soft-fail 403 (not admin)': () => true });
  } else {
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  sleep(5);
}
