// Safety note: smoke only. Message list reads the conversation store and
// shares an account bucket with /threads traffic (6/60s). Keep sleep at 11s
// per VU and never promote past smoke even if K6_PROFILE requests more; the
// runtime guard downgrades anything else to smoke. Skip-exit if either
// K6_APP_ID or K6_THREAD_ID unset.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

const appId = __ENV.K6_APP_ID && __ENV.K6_APP_ID.trim();
const threadId = __ENV.K6_THREAD_ID && __ENV.K6_THREAD_ID.trim();
const skipping = !appId || !threadId;

if (!skipping) requireBearer();

// Downgrade anything above smoke since this shares the per-account bucket.
const chosen = profile === 'smoke' ? 'smoke' : 'smoke';

export const options = skipping
  ? { vus: 1, iterations: 1 }
  : { ...pick(chosen), thresholds: defaultThresholds, tags: { scenario: 'thread-messages' } };

export function setup () {
  if (skipping) console.log('K6_APP_ID and/or K6_THREAD_ID not set; thread-messages skipped.');
}

export default function () {
  if (skipping) return;
  const url = `${baseUrl}/v1/org/${orgId}/copilotapps/${appId}/threads/${threadId}/messages`;
  const res = http.get(url, { headers, tags: { scenario: 'thread-messages' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(11);
}
