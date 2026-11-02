import { randomUUID } from 'node:crypto';
import { db } from './storage';
import type { CrawlJobConfig, Job, JobPriority } from './types';

export interface EnqueueInput {
  url: string;
  company_name?: string;
  max_attempts?: number;
  priority?: JobPriority;
  config?: CrawlJobConfig;
}

export type EnqueueResult =
  | { created: true; job: Job }
  | { created: false; reason: 'duplicate'; existingJob: Job };

export const RUNNING_JOB_LEASE_MS = 5 * 60 * 1000;

interface RawJob {
  id: string;
  url: string;
  company_name: string | null;
  priority: string | null;
  config_json: string | null;
  status: Job['status'];
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

function parsePriority(value: string | null): JobPriority {
  if (value === 'low' || value === 'normal' || value === 'high') {
    return value;
  }
  return 'normal';
}

function parseConfig(value: string | null): CrawlJobConfig | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CrawlJobConfig;
  } catch {
    return null;
  }
}

function mapRawJob(rawJob: RawJob): Job {
  return {
    id: rawJob.id,
    url: rawJob.url,
    company_name: rawJob.company_name,
    priority: parsePriority(rawJob.priority),
    config: parseConfig(rawJob.config_json),
    status: rawJob.status,
    attempts: rawJob.attempts,
    max_attempts: rawJob.max_attempts,
    error: rawJob.error,
    created_at: rawJob.created_at,
    updated_at: rawJob.updated_at,
  };
}

function loadJobByUrl(url: string): Job | undefined {
  const job = db.prepare('SELECT * FROM jobs WHERE url = ?').get(url) as RawJob | undefined;
  return job ? mapRawJob(job) : undefined;
}

function insertJob(input: EnqueueInput, id: string, now: string, priority: JobPriority, configJson: string | null): void {
  db.prepare(`
    INSERT INTO jobs (
      id,
      url,
      company_name,
      priority,
      config_json,
      status,
      attempts,
      max_attempts,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)
  `).run(
    id,
    input.url,
    input.company_name ?? null,
    priority,
    configJson,
    input.max_attempts ?? 1,
    now,
    now,
  );
}

export function enqueue(input: EnqueueInput): EnqueueResult {
  const now = new Date().toISOString();
  const id = randomUUID();
  const priority = input.priority ?? 'normal';
  const configJson = input.config ? JSON.stringify(input.config) : null;

  try {
    insertJob(input, id, now, priority, configJson);

    const job: Job = {
      id,
      url: input.url,
      company_name: input.company_name ?? null,
      priority,
      config: input.config ?? null,
      status: 'pending',
      attempts: 0,
      max_attempts: input.max_attempts ?? 1,
      error: null,
      created_at: now,
      updated_at: now,
    };
    return { created: true, job };
  } catch (err: unknown) {
    const sqliteErr = err as { code?: string };
    if (sqliteErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existingJob = loadJobByUrl(input.url);
      if (!existingJob) {
        throw new Error(`enqueue: job duplicado para URL ${input.url} não pôde ser recuperado`);
      }
      return { created: false, reason: 'duplicate', existingJob };
    }
    throw err;
  }
}

interface ListFilter {
  status?: Job['status'];
}

export function list(filter: ListFilter = {}): Job[] {
  const query = filter.status
    ? 'SELECT * FROM jobs WHERE status = ? ORDER BY CASE priority WHEN \'high\' THEN 3 WHEN \'normal\' THEN 2 ELSE 1 END DESC, created_at ASC'
    : 'SELECT * FROM jobs ORDER BY CASE priority WHEN \'high\' THEN 3 WHEN \'normal\' THEN 2 ELSE 1 END DESC, created_at ASC';

  if (filter.status) {
    const jobs = db.prepare(query).all(filter.status) as RawJob[];
    return jobs.map((job) => mapRawJob(job));
  }

  const jobs = db.prepare(query).all() as RawJob[];
  return jobs.map((job) => mapRawJob(job));
}

export function getNext(): Job | null {
  const now = new Date().toISOString();
  while (true) {
    const job = db.prepare(`
      SELECT * FROM jobs WHERE status = 'pending'
      ORDER BY attempts ASC,
        CASE priority WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END DESC,
        updated_at ASC,
        created_at ASC
      LIMIT 1
    `).get() as RawJob | undefined;

    if (!job) return null;

    const result = db.prepare(`
      UPDATE jobs SET status = 'running', updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(now, job.id);

    if (result.changes > 0) {
      return mapRawJob({ ...job, status: 'running', updated_at: now });
    }
  }
}

export function markDone(id: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE jobs SET status = 'done', updated_at = ?
    WHERE id = ?
  `).run(now, id);
}

export function markFailed(id: string, errorMessage: string): void {
  const now = new Date().toISOString();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as RawJob | undefined;

  if (!job) {
    throw new Error(`markFailed: job com id ${id} não encontrado`);
  }

  const newAttempts = job.attempts + 1;
  const willRetry = newAttempts < job.max_attempts;

  db.prepare(`
    UPDATE jobs
    SET status = ?, attempts = ?, error = ?, updated_at = ?
    WHERE id = ?
  `).run(willRetry ? 'pending' : 'failed', newAttempts, errorMessage, now, id);
}

export function recoverRunningJobs(): number {
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - RUNNING_JOB_LEASE_MS).toISOString();
  const result = db.prepare(`
    UPDATE jobs
    SET status = 'pending', updated_at = ?
    WHERE status = 'running' AND updated_at < ?
  `).run(now, staleBefore);

  return result.changes;
}

export function refreshRunningJobLease(id: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE jobs SET updated_at = ?
    WHERE id = ? AND status = 'running'
  `).run(now, id);
}

export function retryFailedByUrl(url: string): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE jobs
    SET status = 'pending', attempts = 0, error = NULL, updated_at = ?
    WHERE url = ? AND status = 'failed'
  `).run(now, url);

  return result.changes > 0;
}

export function countPending(): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'
  `).get() as { count: number };

  return result.count;
}

export function findByUrl(url: string): Job | undefined {
  return loadJobByUrl(url);
}