import { test, expect } from '@playwright/test';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Extends header-leakage with explicit session/cookie markers. Any match in
// test-results/ or playwright-report/ indicates the auth material or a session
// cookie leaked into a persisted artifact — fail hard.
const LEAK_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'fc.session', pattern: /fc\.session=/i },
  { label: 'bolt.session', pattern: /bolt\.session=/i },
  { label: 'jwt-in-token', pattern: /token=eyJ[A-Za-z0-9._-]+/i },
  { label: 'cf-bm-cookie', pattern: /__cf_bm=/i },
  { label: 'boltic-ssid-cookie', pattern: /boltic-ssid=/i },
];
const SCAN_EXTENSIONS = new Set(['.json', '.txt', '.log', '.zip', '.html', '.md', '.har', '.xml']);
const MAX_BYTES = 2_000_000;

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

async function scanFile(path: string): Promise<string[]> {
  const info = await stat(path).catch(() => null);
  if (!info || info.size > MAX_BYTES) return [];
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  if (!SCAN_EXTENSIONS.has(ext)) return [];
  const data = await readFile(path, 'utf8').catch(() => '');
  return LEAK_PATTERNS.filter(p => p.pattern.test(data)).map(p => p.label);
}

async function scanRoot(root: string): Promise<Array<{ file: string; labels: string[] }>> {
  const leaks: Array<{ file: string; labels: string[] }> = [];
  for await (const file of walk(root)) {
    const labels = await scanFile(file);
    if (labels.length) leaks.push({ file: file.replace(root, root.split('/').pop() ?? root), labels });
  }
  return leaks;
}

test.describe('session leak deep @security', () => {
  test('test-results contains no session or JWT cookies', async () => {
    const leaks = await scanRoot(resolve('test-results'));
    // Only emit file paths and labels — never the matched values.
    expect(leaks, `session-shaped tokens found in test-results: ${JSON.stringify(leaks)}`).toEqual([]);
  });

  test('playwright-report (if present) contains no session or JWT cookies', async () => {
    const leaks = await scanRoot(resolve('playwright-report'));
    expect(leaks, `session-shaped tokens found in playwright-report: ${JSON.stringify(leaks)}`).toEqual([]);
  });
});
