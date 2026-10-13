import {
  getNext,
  markDone,
  markFailed,
  countPending,
  recoverRunningJobs,
  refreshRunningJobLease,
  RUNNING_JOB_LEASE_MS,
} from './queue';
import { runCrawler } from '../crawler';
import { setSilent, logQueue } from '../logger';
import type { Job } from './types';

export interface QueueJobExecutor {
  execute(job: Job): Promise<void>;
}

class CrawlerQueueExecutor implements QueueJobExecutor {
  async execute(job: Job): Promise<void> {
    await runCrawler(job.url);
  }
}

function formatResult(index: number, total: number, job: Job, status: 'done' | 'failed', durationMs: number, reason?: string): string {
  const icon = status === 'done' ? '✅' : '❌';
  const seconds = (durationMs / 1000).toFixed(1);
  const suffix = reason ? ` (${reason})` : '';
  return `[${index}/${total}] ${job.url} ... ${icon} ${status}${suffix} (${seconds}s)`;
}

function formatRetry(attempt: number, maxAttempts: number, job: Job, durationMs: number, reason: string): string {
  const seconds = (durationMs / 1000).toFixed(1);
  return `[retry ${attempt}/${maxAttempts}] ${job.url} ... ⚠ retry agendado (${reason}) (${seconds}s)`;
}

type JobOutcome = 'done' | 'retry' | 'failed';

async function processJob(
  executor: QueueJobExecutor | ((url: string) => Promise<unknown>),
  job: Job,
): Promise<{ outcome: JobOutcome; durationMs: number; reason?: string }> {
  const start = Date.now();
  const heartbeat = setInterval(() => refreshRunningJobLease(job.id), RUNNING_JOB_LEASE_MS / 3);

  try {
    if (typeof executor === 'function') {
      await executor(job.url);
    } else {
      await executor.execute(job);
    }
    markDone(job.id);
    return { outcome: 'done', durationMs: Date.now() - start };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markFailed(job.id, message);

    const attempt = job.attempts + 1;
    if (attempt < job.max_attempts) {
      logQueue(formatRetry(attempt, job.max_attempts, job, Date.now() - start, message));
      return { outcome: 'retry', durationMs: Date.now() - start };
    }

    return { outcome: 'failed', durationMs: Date.now() - start, reason: message };
  } finally {
    clearInterval(heartbeat);
  }
}

export async function processQueue(
  executor: QueueJobExecutor | ((url: string) => Promise<unknown>) = new CrawlerQueueExecutor(),
): Promise<void> {
  const recoveredJobs = recoverRunningJobs();
  if (recoveredJobs > 0) {
    logQueue(`${recoveredJobs} job(s) em running foram reencaminhados para pending.`);
  }

  const total = countPending();
  if (total === 0) {
    logQueue('Nenhum job pendente na fila.');
    return;
  }

  setSilent(true);
  let attempts = 0;
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const start = Date.now();

  try {
    let job = getNext();
    while (job) {
      attempts++;
      const result = await processJob(executor, job);

      if (result.outcome === 'retry') {
        job = getNext();
        continue;
      }

      completed++;
      if (result.outcome === 'done') {
        succeeded++;
        logQueue(formatResult(completed, total, job, 'done', result.durationMs));
      } else {
        failed++;
        logQueue(formatResult(completed, total, job, 'failed', result.durationMs, result.reason));
      }

      job = getNext();
    }
  } finally {
    setSilent(false);
  }

  const totalSeconds = ((Date.now() - start) / 1000).toFixed(1);
  logQueue(`\nFila processada: ${completed} job(s) em ${totalSeconds}s — ${succeeded} sucesso(s), ${failed} falha(s), ${attempts} tentativa(s).`);
}