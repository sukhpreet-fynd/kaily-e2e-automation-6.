import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

// GET /v1/org/{accountId}/threads/{threadId}
// Reads a single thread. Requires K6_THREAD_ID; skips cleanly if unset
// by running a single no-op iteration so k6 exits 0.
const threadId = __ENV.K6_THREAD_ID && __ENV.K6_THREAD_ID.trim();
const skipping = !threadId;

if (!skipping) requireBearer();

export const options = skipping
  ? { vus: 1, iterations: 1 }
  : { ...pick(profile), thresholds: defaultThresholds, tags: { scenario: 'thread-detail' } };

export function setup() {
  if (skipping) console.log('K6_THREAD_ID is not set; thread-detail skipped.');
}

export default function () {
  if (skipping) return;
  const url = `${baseUrl}/v1/org/${orgId}/threads/${threadId}`;
  const res = http.get(url, { headers, tags: { scenario: 'thread-detail' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  // Same per-account bucket as the threads list (6/60s). Sleep 11s keeps
  // a single VU safe; keep this on smoke to avoid cross-VU contention.
  sleep(11);
}
