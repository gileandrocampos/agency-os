// src/cli/commands/register-queue-commands.ts
import { Command } from 'commander';
import { enqueueSitesUseCase } from '../../application/enqueue-sites.usecases';
import { runQueueUseCase } from '../../application/run-queue.usecase';
import { printError, printInfo, printSuccess } from '../output/printer';
import { logError } from '../../logger';
import type { JobStatus } from '../../queue';
import { findByUrl, list } from '../../queue';

export function registerQueueCommands(program: Command): void {
  program
    .command('queue:add')
    .description('Adiciona uma ou mais URLs na fila de crawl')
    .argument('<urls...>', 'URLs a enfileirar')
    .action((urls: string[]) => {
      const results = enqueueSitesUseCase({ urls });
      const created = results.filter((r) => r.created).length;
      const duplicates = results.length - created;
      printSuccess(`${created} job(s) criado(s), ${duplicates} já existiam.`);
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
          printInfo(`Tentativas: ${job.attempts}/${job.max_attempts}`);
          printInfo(`Criado em:  ${job.created_at}`);
          printInfo(`Atualizado: ${job.updated_at}`);
          if (job.error) printInfo(`Erro:       ${job.error}`);
        });
}