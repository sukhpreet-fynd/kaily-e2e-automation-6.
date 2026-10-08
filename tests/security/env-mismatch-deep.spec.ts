import { test, expect } from '@playwright/test';
import { coreConfig } from '../../src/config/env.ts';

// Static guard: coreConfig must refuse a KAILY_ENV/KAILY_ORG_ID combination that
// crosses environment boundaries. This protects against accidentally pointing the
// suite at a mismatched tenant (e.g. running prod-config auth against uat).
test.describe('env mismatch deep @security', () => {
  test('coreConfig rejects uat KAILY_ENV with prod KAILY_ORG_ID', () => {
    const env = {
      KAILY_ENV: 'uat',
      // Deliberately pass the prod org id against the uat env.
      KAILY_ORG_ID: 'e6af7bff-e89d-467b-9efe-69a2c9ad0957',
    };
    let caught: Error | null = null;
    try { coreConfig(env); }
    catch (err) { caught = err as Error; }
    expect(caught, 'coreConfig should throw on org/env mismatch').not.toBeNull();
    expect(caught!.message.toLowerCase()).toContain('authorized scope');
  });

  test('coreConfig rejects prod KAILY_ENV with uat KAILY_ORG_ID', () => {
    const env = {
      KAILY_ENV: 'prod',
      KAILY_ORG_ID: '1e31f28f-f6bd-45b6-995d-fd02076d6d78',
    };
    let caught: Error | null = null;
    try { coreConfig(env); }
    catch (err) { caught = err as Error; }
    expect(caught, 'coreConfig should throw on org/env mismatch').not.toBeNull();
    expect(caught!.message.toLowerCase()).toContain('authorized scope');
  });

  test('coreConfig rejects an unknown KAILY_ENV', () => {
    const env = { KAILY_ENV: 'staging' };
    let caught: Error | null = null;
    try { coreConfig(env); }
    catch (err) { caught = err as Error; }
    expect(caught, 'coreConfig should refuse unknown env names').not.toBeNull();
    expect(caught!.message).toMatch(/KAILY_ENV must be one of/);
  });
});
