import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../queue', () => ({
  processQueue: vi.fn(),
}));

import { processQueue } from '../../queue';
import { runQueueUseCase } from '../../application/run-queue.usecase';

describe('runQueueUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega para processQueue sem argumentos', async () => {
    (processQueue as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runQueueUseCase();

    expect(processQueue).toHaveBeenCalledOnce();
  });

  it('propaga erros lançados por processQueue', async () => {
    const err = new Error('falha na fila');
    (processQueue as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    await expect(runQueueUseCase()).rejects.toThrow(err);
  });
});
