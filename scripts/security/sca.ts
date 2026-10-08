import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

type Severity = 'low' | 'moderate' | 'high' | 'critical';
const LOCKFILE_MAX_LAG_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SEVERITIES: readonly Severity[] = ['low', 'moderate', 'high', 'critical'] as const;
const FAIL_LEVELS: Record<string, Severity> = { high: 'high', critical: 'critical' };

interface AuditVulnerability {
  severity?: string;
  via?: unknown;
}
interface AuditReport {
  vulnerabilities?: Record<string, AuditVulnerability>;
  metadata?: { vulnerabilities?: Partial<Record<Severity, number>> };
}

async function runAudit(): Promise<AuditReport> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['audit', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', c => errors.push(c));
    child.on('error', err => reject(new Error(`npm audit failed to start: ${err.message}`)));
    child.on('close', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return reject(new Error(`npm audit produced no output. stderr: ${Buffer.concat(errors).toString('utf8').slice(0, 200)}`));
      try { resolve(JSON.parse(raw) as AuditReport); }
      catch { reject(new Error('npm audit returned non-JSON output.')); }
    });
  });
}

function tallyBySeverity(report: AuditReport): Record<Severity, number> {
  const counts: Record<Severity, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  const metaCounts = report.metadata?.vulnerabilities;
  if (metaCounts) {
    for (const sev of SEVERITIES) counts[sev] = Number(metaCounts[sev] ?? 0);
    return counts;
  }
  for (const entry of Object.values(report.vulnerabilities ?? {})) {
    const sev = String(entry.severity ?? '').toLowerCase();
    if ((SEVERITIES as readonly string[]).includes(sev)) counts[sev as Severity]++;
  }
  return counts;
}

function topPackageNames(report: AuditReport, limit = 5): string[] {
  const names = Object.keys(report.vulnerabilities ?? {});
  return names.slice(0, limit);
}

function printTable(counts: Record<Severity, number>, topPackages: string[], lockLagDays: number | null): void {
  const rows = SEVERITIES.map(sev => `${sev.padEnd(10)}${String(counts[sev]).padStart(6)}`);
  const lockLine = lockLagDays === null
    ? 'Lockfile lag: (not measurable)'
    : `Lockfile lag: ${lockLagDays.toFixed(1)}d (limit ${LOCKFILE_MAX_LAG_DAYS}d)`;
  process.stdout.write([
    'Severity   Count',
    ...rows,
    '',
    `Top packages (max 5): ${topPackages.join(', ') || '(none)'}`,
    lockLine,
    '',
  ].join('\n'));
}

interface LockfileFreshness { lagDays: number | null; stale: boolean; reason: string | null; }

async function checkLockfileFreshness(): Promise<LockfileFreshness> {
  try {
    const [pkgStat, lockStat] = await Promise.all([
      stat(resolve('package.json')),
      stat(resolve('package-lock.json')),
    ]);
    const lagMs = pkgStat.mtimeMs - lockStat.mtimeMs;
    const lagDays = lagMs / MS_PER_DAY;
    if (lagDays > LOCKFILE_MAX_LAG_DAYS) {
      return { lagDays, stale: true, reason: `package-lock.json is ${lagDays.toFixed(1)}d older than package.json (limit ${LOCKFILE_MAX_LAG_DAYS}d).` };
    }
    return { lagDays, stale: false, reason: null };
  } catch (error) {
    return { lagDays: null, stale: false, reason: `lockfile stat failed: ${(error as Error).message}` };
  }
}

function resolveFailLevel(raw: string | undefined): Severity {
  const value = (raw ?? 'high').toLowerCase();
  const resolved = FAIL_LEVELS[value];
  if (!resolved) throw new Error(`SCA_FAIL_LEVEL must be 'high' or 'critical' (got '${raw}').`);
  return resolved;
}

async function main(): Promise<void> {
  let failLevel: Severity;
  let report: AuditReport;
  try {
    failLevel = resolveFailLevel(process.env.SCA_FAIL_LEVEL);
    report = await runAudit();
  } catch (error) {
    process.stderr.write(`sca: ${(error as Error).message}\n`);
    process.exit(2);
  }
  const counts = tallyBySeverity(report);
  const freshness = await checkLockfileFreshness();
  printTable(counts, topPackageNames(report), freshness.lagDays);
  const gated = failLevel === 'critical' ? counts.critical > 0 : counts.critical > 0 || counts.high > 0;
  if (gated) {
    process.stdout.write(`sca: gate failed at level '${failLevel}' (critical=${counts.critical}, high=${counts.high})\n`);
    process.exit(1);
  }
  if (freshness.stale) {
    process.stdout.write(`sca: lockfile freshness gate failed — ${freshness.reason}\n`);
    process.exit(1);
  }
  if (freshness.reason && freshness.lagDays === null) {
    process.stdout.write(`sca: lockfile freshness skipped — ${freshness.reason}\n`);
  }
  process.stdout.write('sca: clean under configured gate.\n');
  process.exit(0);
}

void main();
