import { Command } from 'commander';
import { enqueueSitesUseCase } from '../../application/enqueue-sites.usecase';
import { runQueueUseCase } from '../../application/run-queue.usecase';
import { printError, printInfo, printSuccess } from '../output/printer';
import { logError } from '../../logger';
import type { JobPriority, JobStatus } from '../../queue';
import { findByUrl, list, retryFailedByUrl } from '../../queue';

function parsePriority(input?: string): JobPriority {
  if (input === 'low' || input === 'normal' || input === 'high') {
    return input;
  }
  return 'normal';
}

function parseMaxAttempts(input?: string): number {
  if (!input) {
    return 1;
  }

  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('max-attempts deve ser um inteiro maior ou igual a 1');
  }

  return parsed;
}

export function registerQueueCommands(program: Command): void {
  program
    .command('queue:add')
    .description('Adiciona uma ou mais URLs na fila de crawl')
    .option('-p, --priority <priority>', 'prioridade do job (low, normal, high)', 'normal')
    .option('-m, --max-attempts <number>', 'máximo de tentativas por job', '1')
    .argument('<urls...>', 'URLs a enfileirar')
    .action((urls: string[], options: { priority?: string; maxAttempts?: string }) => {
      const priority = parsePriority(options.priority);
      try {
        const maxAttempts = parseMaxAttempts(options.maxAttempts);
        const results = enqueueSitesUseCase({ urls, priority, max_attempts: maxAttempts });
        const created = results.filter((r) => r.created).length;
        const duplicates = results.length - created;
        printSuccess(
          `${created} job(s) criado(s), ${duplicates} já existiam. Prioridade: ${priority}. Tentativas: ${maxAttempts}.`,
        );
      } catch (error) {
        logError('Falha ao adicionar URLs na fila', error);
        printError('Não foi possível enfileirar as URLs informadas.');
        process.exitCode = 1;
      }
    });

  program
    .command('queue:run')
    .description('Processa todos os jobs pendentes da fila')
    .action(async () => {
      try {
        await runQueueUseCase();
      } catch (error) {
        logError('Falha ao processar a fila', error);
        printError('O processamento da fila encerrou com erro.');
        process.exitCode = 1;
      }
    });

  program
    .command('queue:list')
    .description('Lista os jobs da fila')
    .option('-s, --status <status>', 'filtrar por status (pending, running, done, failed)')
    .action((options: { status?: JobStatus }) => {
      const jobs = list(options.status ? { status: options.status } : {});

      if (jobs.length === 0) {
        printInfo('Nenhum job encontrado.');
        return;
      }

      for (const job of jobs) {
        const icon = { pending: '⏳', running: '🔄', done: '✅', failed: '❌' }[job.status];
        printInfo(`${icon} ${job.status.padEnd(8)} ${job.url}`);
      }

      printInfo(`\nTotal: ${jobs.length} job(s).`);
    });

  program
    .command('queue:status')
    .description('Mostra o detalhe de um job pela URL')
    .argument('<url>', 'URL do job')
    .action((url: string) => {
      const job = findByUrl(url);
      if (!job) {
        printInfo('Job não encontrado.');
        return;
      }

      printInfo(`URL:        ${job.url}`);
      printInfo(`Status:     ${job.status}`);
      printInfo(`Prioridade: ${job.priority}`);
      printInfo(`Tentativas: ${job.attempts}/${job.max_attempts}`);
      printInfo(`Criado em:  ${job.created_at}`);
      printInfo(`Atualizado: ${job.updated_at}`);
      if (job.error) printInfo(`Erro:       ${job.error}`);
    });

  program
    .command('queue:retry')
    .description('Reprocessa um job com status failed usando a URL')
    .argument('<url>', 'URL do job')
    .action((url: string) => {
      const requeued = retryFailedByUrl(url);

      if (!requeued) {
        printInfo('Nenhum job failed encontrado para essa URL.');
        return;
      }

      printSuccess('Job reencaminhado para pending com tentativas resetadas.');
    });
}
