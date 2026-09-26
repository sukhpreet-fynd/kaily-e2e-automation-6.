export class HttpFailure extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Kaily API returned HTTP ${status}; response body omitted.`);
    this.status = status;
  }
}

export type JsonObject = Record<string, unknown>;
export function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unexpected API object shape; body omitted.');
  return value as JsonObject;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('API response is missing a required identifier.');
  return value;
}
export function items(value: unknown): JsonObject[] {
  const list = object(value).items;
  if (!Array.isArray(list)) throw new Error('API response is missing its items array.');
  return list.map(object);
}

// Native fetch avoids attaching credential-bearing API calls to Playwright traces/steps.
// No redirects, automatic mutation retries, raw response logging or arbitrary URLs.
export async function jsonRequest(base: string, path: string, headers: Record<string, string>,
  method: 'GET' | 'POST' = 'GET', body?: JsonObject, timeoutMs = 15_000): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method, redirect: 'manual', headers: { ...headers, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeoutMs),
    });
  } catch { throw new Error('Kaily API transport failed; request details omitted.'); }
  if (!response.ok) throw new HttpFailure(response.status);
  try { return await response.json(); } catch { throw new Error('Kaily API returned invalid JSON; body omitted.'); }
}
