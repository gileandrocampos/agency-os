import { randomUUID } from 'node:crypto';
import { db } from './storage';
import type { Job } from './types';

interface EnqueueInput {
  url: string;
  company_name?: string;
  max_attempts?: number;
}

type EnqueueResult =
  | { created: true; job: Job }
  | { created: false; reason: 'duplicate'; existingJob: Job };

export function enqueue(input: EnqueueInput): EnqueueResult {
  const now = new Date().toISOString();
  const id = randomUUID();

  try {
    db.prepare(`
      INSERT INTO jobs (id, url, company_name, status, attempts, max_attempts, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)
    `).run(id, input.url, input.company_name ?? null, input.max_attempts ?? 1, now, now);

    const job: Job = {
        id, url: input.url, company_name: input.company_name ?? null,
        status: 'pending', attempts: 0, max_attempts: input.max_attempts ?? 1,
        error: null, created_at: now, updated_at: now,
    };
    return { created: true, job };

  } catch (err: unknown) {
    const sqliteErr = err as { code?: string };
    if (sqliteErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existingJob = db.prepare('SELECT * FROM jobs WHERE url = ?').get(input.url) as Job;
      return { created: false, reason: 'duplicate', existingJob };
    }
    throw err;
  }
}

interface ListFilter {
  status?: Job['status'];
}

export function list(filter: ListFilter = {}): Job[] {
  if (filter.status) {
    return db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC')
      .all(filter.status) as Job[];
  }
  return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as Job[];
}

export function getNext(): Job | null {
  const now = new Date().toISOString();

  const job = db.prepare(`
    SELECT * FROM jobs WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
  `).get() as Job | undefined;

  if (!job) return null;

  const result = db.prepare(`
    UPDATE jobs SET status = 'running', updated_at = ?
    WHERE id = ? AND status = 'pending'
  `).run(now, job.id);

  if (result.changes === 0) {

    return getNext();
  }

  return { ...job, status: 'running', updated_at: now };
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
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;

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

export function countPending(): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'
  `).get() as { count: number };

  return result.count;
}

export function findByUrl(url: string): Job | undefined {
  return db.prepare('SELECT * FROM jobs WHERE url = ?').get(url) as Job | undefined;
}