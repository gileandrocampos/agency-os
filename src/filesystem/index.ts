import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function buildSessionDir(outputBase: string, domain: string, timestamp: string): string {
  return path.join(outputBase, `${domain}_${timestamp}`);
}

interface DomainBlockMetric {
  attempts: number;
  blocked: number;
  lastAttemptAt: string;
  lastBlockedAt?: string;
  lastChallengeType?: string;
}

type DomainBlockMetricStore = Record<string, DomainBlockMetric>;

const DEFAULT_BLOCK_METRICS_FILE = 'block-metrics.json';

export function recordDomainAttempt(logsDir: string, domain: string, timestamp: string, fileName = DEFAULT_BLOCK_METRICS_FILE): void {
  const sanitizedFileName = sanitizeMetricsFileName(fileName);
  const metrics = readDomainMetrics(logsDir, sanitizedFileName);
  const current = metrics[domain] ?? { attempts: 0, blocked: 0, lastAttemptAt: timestamp };

  metrics[domain] = {
    ...current,
    attempts: current.attempts + 1,
    lastAttemptAt: timestamp,
  };

  persistDomainMetrics(logsDir, sanitizedFileName, metrics);
}

export function recordDomainBlock(
  logsDir: string,
  domain: string,
  timestamp: string,
  challengeType: string,
  fileName = DEFAULT_BLOCK_METRICS_FILE,
): void {
  const sanitizedFileName = sanitizeMetricsFileName(fileName);
  const metrics = readDomainMetrics(logsDir, sanitizedFileName);
  const current = metrics[domain] ?? { attempts: 0, blocked: 0, lastAttemptAt: timestamp };

  metrics[domain] = {
    ...current,
    blocked: current.blocked + 1,
    lastBlockedAt: timestamp,
    lastChallengeType: challengeType,
  };

  persistDomainMetrics(logsDir, sanitizedFileName, metrics);
}

function sanitizeMetricsFileName(fileName: string): string {
  const normalized = path.basename(fileName.trim());

  if (normalized.length === 0) {
    return DEFAULT_BLOCK_METRICS_FILE;
  }

  const validFileNamePattern = /^[a-zA-Z0-9._-]+$/;
  if (!validFileNamePattern.test(normalized)) {
    return DEFAULT_BLOCK_METRICS_FILE;
  }

  return normalized;
}

function readDomainMetrics(logsDir: string, fileName: string): DomainBlockMetricStore {
  const filePath = path.join(logsDir, fileName);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as DomainBlockMetricStore;
  } catch {
    return {};
  }
}

function persistDomainMetrics(logsDir: string, fileName: string, metrics: DomainBlockMetricStore): void {
  ensureDir(logsDir);
  const filePath = path.join(logsDir, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf-8');
}
