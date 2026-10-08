import { test as base, expect } from '@playwright/test';
import { installOrganizationGuard } from '../auth/scope.ts';
import { captureBearerForTests } from '../security/bearer.ts';
import { probeStatus, probeFull, probeMethod, type ProbeResult, type ProbeFullOptions, type ProbeFullResult } from '../security/probe.ts';

type Probe = (url: string, headers?: Record<string, string>, timeoutMs?: number) => Promise<ProbeResult>;
type ProbeFullFn = (url: string, options?: ProbeFullOptions) => Promise<ProbeFullResult>;
type ProbeMethodFn = (url: string, method: string, headers?: Record<string, string>, timeoutMs?: number) => Promise<ProbeFullResult>;

export const test = base.extend<{ probe: Probe; probeFull: ProbeFullFn; probeMethod: ProbeMethodFn; bearer: string }>({
  context: async ({ context }, use) => { await installOrganizationGuard(context); await use(context); },
  probe: async ({}, use) => { await use((url, headers, timeoutMs) => probeStatus(url, headers, timeoutMs)); },
  probeFull: async ({}, use) => { await use((url, options) => probeFull(url, options)); },
  probeMethod: async ({}, use) => { await use((url, method, headers, timeoutMs) => probeMethod(url, method, headers, timeoutMs)); },
  bearer: async ({ page }, use) => { await use(await captureBearerForTests(page)); },
});
export { expect };
