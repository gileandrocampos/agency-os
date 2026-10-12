import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../queue/queue', () => ({
  getNext: vi.fn(),
  markDone: vi.fn(),
  markFailed: vi.fn(),
  recoverRunningJobs: vi.fn(),
  countPending: vi.fn(),
}));

vi.mock('../../logger', () => ({
  setSilent: vi.fn(),
  logQueue: vi.fn(),
}));

vi.mock('../../crawler', () => ({
  runCrawler: vi.fn(),
}));

import { getNext, markDone, markFailed, recoverRunningJobs, countPending } from '../../queue/queue';
import { runCrawler } from '../../crawler';
import { setSilent, logQueue } from '../../logger';
import { processQueue } from '../../queue/consumer';
import type { Job, QueueJobExecutor } from '../../queue';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    url: 'https://example.com',
    company_name: null,
    priority: 'normal',
    config: null,
    status: 'pending',
    attempts: 0,
    max_attempts: 1,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('processQueue', () => {
  const runCrawl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encerra imediatamente quando não há jobs pendentes', async () => {
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(0);

    await processQueue(runCrawl);

    expect(logQueue).toHaveBeenCalledWith(expect.stringContaining('Nenhum job pendente'));
    expect(getNext).not.toHaveBeenCalled();
  });

  it('ativa o modo silencioso durante o processamento e restaura ao final', async () => {
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (getNext as ReturnType<typeof vi.fn>).mockReturnValueOnce(makeJob()).mockReturnValue(null);
    runCrawl.mockResolvedValue(undefined);

    await processQueue(runCrawl);

    expect(setSilent).toHaveBeenNthCalledWith(1, true);
    expect(setSilent).toHaveBeenNthCalledWith(2, false);
  });

  it('chama markDone e loga sucesso quando o crawl é bem-sucedido', async () => {
    const job = makeJob();
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (getNext as ReturnType<typeof vi.fn>).mockReturnValueOnce(job).mockReturnValue(null);
    runCrawl.mockResolvedValue(undefined);

    await processQueue(runCrawl);

    expect(markDone).toHaveBeenCalledWith(job.id);
    expect(logQueue).toHaveBeenCalledWith(expect.stringContaining('done'));
  });

  it('chama markFailed e loga falha quando o crawl lança erro', async () => {
    const job = makeJob();
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (getNext as ReturnType<typeof vi.fn>).mockReturnValueOnce(job).mockReturnValue(null);
    runCrawl.mockRejectedValue(new Error('timeout'));

    await processQueue(runCrawl);

    expect(markFailed).toHaveBeenCalledWith(job.id, 'timeout');
    expect(logQueue).toHaveBeenCalledWith(expect.stringContaining('failed'));
  });

  it('processa múltiplos jobs em sequência e exibe o resumo correto', async () => {
    const job1 = makeJob({ id: 'job-1', url: 'https://a.com' });
    const job2 = makeJob({ id: 'job-2', url: 'https://b.com' });
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(2);
    (getNext as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(job1)
      .mockReturnValueOnce(job2)
      .mockReturnValue(null);
    runCrawl
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('erro'));

    await processQueue(runCrawl);

    expect(markDone).toHaveBeenCalledWith(job1.id);
    expect(markFailed).toHaveBeenCalledWith(job2.id, 'erro');
    const summaryCall = (logQueue as ReturnType<typeof vi.fn>).mock.calls.find(
      (args) => String(args[0]).includes('Fila processada'),
    );
    expect(summaryCall).toBeDefined();
    if (!summaryCall) return;
    expect(summaryCall[0]).toContain('1 sucesso');
    expect(summaryCall[0]).toContain('1 falha');
  });

  it('restaura o modo silencioso mesmo quando um job lança exceção inesperada', async () => {
    const job = makeJob();
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (getNext as ReturnType<typeof vi.fn>).mockReturnValueOnce(job).mockReturnValue(null);
    runCrawl.mockRejectedValue(new Error('crash'));

    await processQueue(runCrawl);

    expect(setSilent).toHaveBeenCalledWith(false);
  });

  it('loga recuperação de jobs running antes de iniciar o loop', async () => {
    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(2);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(0);

    await processQueue();

    expect(logQueue).toHaveBeenCalledWith('2 job(s) em running foram reencaminhados para pending.');
  });

  it('permite injetar executor customizado sem chamar runCrawler', async () => {
    const job = makeJob();
    const execute = vi.fn().mockResolvedValue(undefined);
    const executor: QueueJobExecutor = { execute };

    (recoverRunningJobs as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (countPending as ReturnType<typeof vi.fn>).mockReturnValue(1);
    (getNext as ReturnType<typeof vi.fn>).mockReturnValueOnce(job).mockReturnValue(null);

    await processQueue(executor);

    expect(execute).toHaveBeenCalledWith(job);
    expect(runCrawler).not.toHaveBeenCalled();
  });
});
