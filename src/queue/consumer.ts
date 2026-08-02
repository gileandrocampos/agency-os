import { getNext, markDone, markFailed, countPending } from './queue';
import { runCrawler } from '../crawler';
import { setSilent, logQueue } from '../logger';
import type { Job } from './types';

function formatResult(index: number, total: number, job: Job, status: 'done' | 'failed', durationMs: number, reason?: string): string {
  const icon = status === 'done' ? '✅' : '❌';
  const seconds = (durationMs / 1000).toFixed(1);
  const suffix = reason ? ` (${reason})` : '';
  return `[${index}/${total}] ${job.url} ... ${icon} ${status}${suffix} (${seconds}s)`;
}

async function processJob(job: Job, index: number, total: number): Promise<boolean> {
  const start = Date.now();

  try {
    await runCrawler(job.url);
    markDone(job.id);
    logQueue(formatResult(index, total, job, 'done', Date.now() - start));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markFailed(job.id, message);
    logQueue(formatResult(index, total, job, 'failed', Date.now() - start, message));
    return false;
  }
}

export async function processQueue(): Promise<void> {
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
      const ok = await processJob(job, index, total);
      if (ok) succeeded++; else failed++;
      job = getNext();
    }
  } finally {
    setSilent(false);
  }

  const totalSeconds = ((Date.now() - start) / 1000).toFixed(1);
  logQueue(`\nFila processada: ${index} job(s) em ${totalSeconds}s — ${succeeded} sucesso(s), ${failed} falha(s).`);
}