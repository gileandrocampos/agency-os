import {
  getNext,
  markDone,
  markFailed,
  countPending,
  recoverRunningJobs,
  refreshRunningJobLease,
  RUNNING_JOB_LEASE_MS,
} from './queue';
import { setSilent, logQueue } from '../logger';
import type { Job } from './types';

export interface QueueJobExecutor {
  execute(job: Job): Promise<void>;
}

function formatResult(index: number, total: number, job: Job, status: 'done' | 'failed', durationMs: number, reason?: string): string {
  const icon = status === 'done' ? '✅' : '❌';
  const seconds = (durationMs / 1000).toFixed(1);
  const suffix = reason ? ` (${reason})` : '';
  return `[${index}/${total}] ${job.url} ... ${icon} ${status}${suffix} (${seconds}s)`;
}

async function processJob(
  executor: QueueJobExecutor | ((url: string) => Promise<unknown>),
  job: Job,
  index: number,
  total: number,
): Promise<boolean> {
  const start = Date.now();
  const heartbeat = setInterval(() => refreshRunningJobLease(job.id), RUNNING_JOB_LEASE_MS / 3);

  try {
    if (typeof executor === 'function') {
      await executor(job.url);
    } else {
      await executor.execute(job);
    }
    markDone(job.id);
    logQueue(formatResult(index, total, job, 'done', Date.now() - start));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markFailed(job.id, message);
    logQueue(formatResult(index, total, job, 'failed', Date.now() - start, message));
    return false;
  } finally {
    clearInterval(heartbeat);
  }
}

export async function processQueue(
  executor: QueueJobExecutor | ((url: string) => Promise<unknown>),
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
  let index = 0;
  let succeeded = 0;
  let failed = 0;
  const start = Date.now();

  try {
    let job = getNext();
    while (job) {
      index++;
      const ok = await processJob(executor, job, index, total);
      if (ok) succeeded++; else failed++;
      job = getNext();
    }
  } finally {
    setSilent(false);
  }

  const totalSeconds = ((Date.now() - start) / 1000).toFixed(1);
  logQueue(`\nFila processada: ${index} job(s) em ${totalSeconds}s — ${succeeded} sucesso(s), ${failed} falha(s).`);
}