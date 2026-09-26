import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { HttpFailure } from '../api/transport.ts';

export async function eventually<T>(read: (remainingMs: number) => Promise<T>, accept: (value: T) => boolean,
  options: { timeoutMs: number; intervalMs?: number; allowNotFound?: boolean }): Promise<T> {
  const deadline = performance.now() + options.timeoutMs;
  let attempts = 0;
  while (performance.now() < deadline) {
    attempts++;
    try {
      const value = await read(Math.max(1, Math.floor(deadline - performance.now())));
      if (accept(value)) return value;
    } catch (error) {
      if (!(options.allowNotFound && error instanceof HttpFailure && error.status === 404)) throw error;
    }
    const remaining = deadline - performance.now();
    if (remaining > 0) await delay(Math.min(options.intervalMs ?? 1000, remaining));
  }
  throw new Error(`Expected data did not become available within ${options.timeoutMs} ms (${attempts} reads).`);
}
