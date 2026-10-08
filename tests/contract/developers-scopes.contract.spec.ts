import { test, expect } from '../../src/fixtures/api.ts';

// Developer scopes shape contract. The console's API-key creation modal
// consumes { scopes: [{ name, category }...], presets: [{ name, scopes }...] }.
// Neo currently serialises scopes as a flat string array and presets as a
// map (constants.js); the console normalises both into the array-of-objects
// shape above. We assert the UI-facing shape and accept either flat strings
// or {name,category} objects to keep this spec green across the migration.
function fail (field: string, reason: string): never {
  throw new Error(`contract: developers/scopes.${field} ${reason}`);
}

function assertScopeEntry (entry: unknown, index: number): void {
  if (typeof entry === 'string' && entry.length) return;
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    const rec = entry as Record<string, unknown>;
    if (typeof rec.name !== 'string' || !rec.name.length) fail(`scopes[${index}].name`, 'must be a non-empty string');
    if (rec.category != null && typeof rec.category !== 'string') fail(`scopes[${index}].category`, 'must be a string if present');
    return;
  }
  fail(`scopes[${index}]`, 'must be a string or { name, category }');
}

function assertPresetEntry (entry: unknown, keyOrIndex: string | number): void {
  if (!entry || typeof entry !== 'object') fail(`presets[${keyOrIndex}]`, 'must be an object or array of scope names');
  if (Array.isArray(entry)) {
    for (const scope of entry) {
      if (typeof scope !== 'string') fail(`presets[${keyOrIndex}].scopes[*]`, 'must be strings');
    }
    return;
  }
  const rec = entry as Record<string, unknown>;
  if (rec.name != null && typeof rec.name !== 'string') fail(`presets[${keyOrIndex}].name`, 'must be a string if present');
  if (!Array.isArray(rec.scopes)) fail(`presets[${keyOrIndex}].scopes`, 'must be an array');
  for (const scope of rec.scopes as unknown[]) {
    if (typeof scope !== 'string') fail(`presets[${keyOrIndex}].scopes[*]`, 'must be strings');
  }
}

test.describe.serial('Contract: developers scopes', () => {
  test('scopes payload matches console modal expectations @contract', async ({ api }) => {
    const body = await api.developers.listScopes();
    if (!Array.isArray(body.scopes)) fail('scopes', 'must be an array');
    (body.scopes as unknown[]).forEach(assertScopeEntry);

    // Neo may return presets as either an array (preferred UI shape) or an
    // object map (current source). Both are accepted and normalised below.
    const presets = body.presets;
    if (Array.isArray(presets)) {
      presets.forEach((p, i) => assertPresetEntry(p, i));
    } else if (presets && typeof presets === 'object') {
      for (const [key, value] of Object.entries(presets as Record<string, unknown>)) {
        assertPresetEntry(value, key);
      }
    } else {
      fail('presets', 'must be an array or object map of presets');
    }
    expect(Array.isArray(body.scopes)).toBe(true);
  });
});
