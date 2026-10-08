export interface ProbeResult { status: number; retryAfter: string | null; }

// Headers that are safe to surface to tests. We never return bodies and never
// surface anything that could leak session or token material.
const SAFE_RESPONSE_HEADERS: readonly string[] = [
  'content-type',
  'retry-after',
  'cache-control',
  'x-ratelimit-remaining',
  'strict-transport-security',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
] as const;

export interface ProbeFullOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export interface ProbeFullResult {
  status: number;
  retryAfter: string | null;
  contentType: string | null;
  headers: Record<string, string>;
}

// Native fetch; never throws on non-2xx. Credential-bearing headers are provided
// by the caller and are never logged or returned.
export async function probeStatus(url: string, headers: Record<string, string> = {}, timeoutMs = 10_000): Promise<ProbeResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', redirect: 'manual', headers, signal: AbortSignal.timeout(timeoutMs) });
  } catch { return { status: 0, retryAfter: null }; }
  return { status: response.status, retryAfter: response.headers.get('retry-after') };
}

// Extended probe. Returns status plus a filtered, safe set of response headers so
// callers can assert transport/CORS/security-header behavior without touching bodies.
export async function probeFull(url: string, options: ProbeFullOptions = {}): Promise<ProbeFullResult> {
  const { method = 'GET', headers = {}, body, timeoutMs = 10_000 } = options;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      redirect: 'manual',
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { status: 0, retryAfter: null, contentType: null, headers: {} };
  }
  const picked: Record<string, string> = {};
  for (const name of SAFE_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value !== null) picked[name] = value;
  }
  return {
    status: response.status,
    retryAfter: response.headers.get('retry-after'),
    contentType: response.headers.get('content-type'),
    headers: picked,
  };
}

// Convenience wrapper for exercising non-GET verbs (OPTIONS/HEAD/DELETE/TRACE/CONNECT).
// No body is sent; this is for method-whitelist probing only.
export async function probeMethod(url: string, method: string, headers: Record<string, string> = {}, timeoutMs = 10_000): Promise<ProbeFullResult> {
  return probeFull(url, { method, headers, timeoutMs });
}
