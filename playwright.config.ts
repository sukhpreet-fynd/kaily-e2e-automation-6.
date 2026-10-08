import { defineConfig, devices } from '@playwright/test';
import { coreConfig } from './src/config/env.ts';
const config = coreConfig();
export default defineConfig({
  globalSetup: './src/auth/state.ts',
  testDir: './tests', testIgnore: '**/unit/**', fullyParallel: false, workers: 1, retries: 0,
  timeout: 180_000, expect: { timeout: 15_000 }, reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'], baseURL: config.baseURL, storageState: config.authFile,
    timezoneId: config.timezone, locale: 'en-US', serviceWorkers: 'block',
    trace: 'off', screenshot: 'off', video: 'off', actionTimeout: 15_000, navigationTimeout: 30_000,
  },
  projects: [
    { name: 'auth', testMatch: '**/setup/*.setup.ts' },
    { name: 'p0', testMatch: '**/p0/*.spec.ts', dependencies: ['auth'] },
    { name: 'api', testMatch: '**/api/*.spec.ts', dependencies: ['auth'] },
    { name: 'ui', testMatch: '**/ui/*.spec.ts', dependencies: ['auth'] },
    { name: 'security', testMatch: '**/security/*.spec.ts', dependencies: ['auth'] },
    { name: 'contract', testMatch: '**/contract/*.spec.ts', dependencies: ['auth'] },
  ],
});
