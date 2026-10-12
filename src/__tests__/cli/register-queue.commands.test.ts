import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../application/run-queue.usecase', () => ({
  runQueueUseCase: vi.fn(),
}));

vi.mock('../../queue', () => ({
  enqueue: vi.fn(),
  list: vi.fn(),
  findByUrl: vi.fn(),
  retryFailedByUrl: vi.fn(),
}));

vi.mock('../../cli/output/printer', () => ({
  printError: vi.fn(),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
}));

vi.mock('../../logger', () => ({
  logError: vi.fn(),
}));

import { runQueueUseCase } from '../../application/run-queue.usecase';
import { enqueue, retryFailedByUrl } from '../../queue';
import { printInfo, printSuccess } from '../../cli/output/printer';
import { registerQueueCommands } from '../../cli/commands/register-queue.commands';

function createProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerQueueCommands(program);
  return program;
}

describe('CLI - comandos de queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria jobs com prioridade e tentativas no comando queue:add', async () => {
    (enqueue as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({ created: true, job: { id: '1' } })
      .mockReturnValueOnce({ created: false, reason: 'duplicate', existingJob: { id: '2' } });

    const program = createProgram();
    await program.parseAsync([
      'node',
      'script',
      'queue:add',
      '--priority',
      'high',
      '--max-attempts',
      '3',
      'https://a.com',
      'https://b.com',
    ]);

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenCalledWith({ url: 'https://a.com', priority: 'high', max_attempts: 3 });
    expect(enqueue).toHaveBeenCalledWith({ url: 'https://b.com', priority: 'high', max_attempts: 3 });
    expect(printSuccess).toHaveBeenCalledWith(
      expect.stringContaining('1 job(s) criado(s), 1 já existiam.'),
    );
  });

  it('delega o comando queue:run para runQueueUseCase', async () => {
    (runQueueUseCase as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const program = createProgram();
    await program.parseAsync(['node', 'script', 'queue:run']);

    expect(runQueueUseCase).toHaveBeenCalledOnce();
  });

  it('reencaminha job failed com queue:retry', async () => {
    (retryFailedByUrl as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const program = createProgram();
    await program.parseAsync(['node', 'script', 'queue:retry', 'https://retry.com']);

    expect(retryFailedByUrl).toHaveBeenCalledWith('https://retry.com');
    expect(printSuccess).toHaveBeenCalledWith(
      'Job reencaminhado para pending com tentativas resetadas.',
    );
  });

  it('informa quando queue:retry não encontra job failed', async () => {
    (retryFailedByUrl as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const program = createProgram();
    await program.parseAsync(['node', 'script', 'queue:retry', 'https://nao-falhou.com']);

    expect(printInfo).toHaveBeenCalledWith('Nenhum job failed encontrado para essa URL.');
  });
});
