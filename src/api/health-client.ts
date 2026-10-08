import { jsonRequest, object } from './transport.ts';

export class HealthClient {
  private readonly base: string;
  constructor(baseURL: string) { this.base = baseURL.replace(/\/$/, ''); }
  async healthz(timeoutMs?: number) {
    return object(await jsonRequest(this.base, '/_healthz', {}, 'GET', undefined, timeoutMs));
  }
  async livez(timeoutMs?: number) {
    return object(await jsonRequest(this.base, '/_livez', {}, 'GET', undefined, timeoutMs));
  }
  async readyz(timeoutMs?: number) {
    return object(await jsonRequest(this.base, '/_readyz', {}, 'GET', undefined, timeoutMs));
  }
}
