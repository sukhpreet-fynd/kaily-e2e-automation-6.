import { test, expect } from '@playwright/test';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SECRET_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'bearer', pattern: /Bearer\s+[A-Za-z0-9._\-]+/ },
  { label: 'authorization-header', pattern: /"authorization"\s*:/i },
  { label: 'cookie-header', pattern: /"cookie"\s*:/i },
  { label: 'boltic-ssid', pattern: /boltic-ssid/i },
];
const SCAN_EXTENSIONS = new Set(['.json', '.txt', '.log', '.zip', '.html', '.md', '.har']);
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
  return SECRET_PATTERNS.filter(p => p.pattern.test(data)).map(p => p.label);
}

test.describe('header & artifact leakage @security', () => {
  test('playwright.config.ts disables trace, screenshot and video', async () => {
    const source = await readFile(resolve('playwright.config.ts'), 'utf8');
    expect(/trace:\s*'off'/.test(source), 'trace must be off').toBe(true);
    expect(/screenshot:\s*'off'/.test(source), 'screenshot must be off').toBe(true);
    expect(/video:\s*'off'/.test(source), 'video must be off').toBe(true);
  });

  test('test-results contains no bearer tokens, auth or cookie headers', async () => {
    const root = resolve('test-results');
    const leaks: Array<{ file: string; labels: string[] }> = [];
    for await (const file of walk(root)) {
      const labels = await scanFile(file);
      if (labels.length) leaks.push({ file: file.replace(root, 'test-results'), labels });
    }
    // Only emit file paths and labels — never the matched values.
    expect(leaks, `secret-shaped tokens found in artifacts: ${JSON.stringify(leaks)}`).toEqual([]);
  });
});
