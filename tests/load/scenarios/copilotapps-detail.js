// Safety note: smoke or baseline. GET /copilotapps/{id} has no documented
// endpoint-level rate limit, but it is account-scoped so cross-VU calls
// still share account buckets. Downgrade stress to baseline. Skip-exit if
// K6_APP_ID unset so pipelines without a fixture pass cleanly.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

const appId = __ENV.K6_APP_ID && __ENV.K6_APP_ID.trim();
const skipping = !appId;

if (!skipping) requireBearer();

const chosen = profile === 'stress' ? 'baseline' : profile;

export const options = skipping
  ? { vus: 1, iterations: 1 }
  : { ...pick(chosen), thresholds: defaultThresholds, tags: { scenario: 'copilotapps-detail' } };

export function setup () {
  if (skipping) console.log('K6_APP_ID is not set; copilotapps-detail skipped.');
}

export default function () {
  if (skipping) return;
  const url = `${baseUrl}/v1/org/${orgId}/copilotapps/${appId}`;
  const res = http.get(url, { headers, tags: { scenario: 'copilotapps-detail' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
}
