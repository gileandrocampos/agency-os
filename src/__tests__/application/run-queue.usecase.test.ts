import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../queue', () => ({
  processQueue: vi.fn(),
}));

vi.mock('../../crawler', () => ({
  runCrawler: vi.fn(),
}));

import { processQueue } from '../../queue';
import { runCrawler } from '../../crawler';
import { runQueueUseCase } from '../../application/run-queue.usecase';

describe('runQueueUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega para processQueue com o executor de crawl', async () => {
    (processQueue as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runQueueUseCase();

    expect(processQueue).toHaveBeenCalledOnce();
    expect(processQueue).toHaveBeenCalledWith(runCrawler);
  });

  it('propaga erros lançados por processQueue', async () => {
    const err = new Error('falha na fila');
    (processQueue as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    await expect(runQueueUseCase()).rejects.toThrow(err);
  });
});
