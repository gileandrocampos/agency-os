import { Command } from 'commander';
import { crawlSiteUseCase } from '../../application/crawl-site.usecase';
import { logError } from '../../logger';
import { printError } from '../output/printer';

export async function handleCrawlCommand(url: string): Promise<void> {
  try {
    await crawlSiteUseCase({ url });
  } catch (error) {
    logError('Falha na execução do crawler', error);
    printError('O crawler encerrou com erro.');
    process.exitCode = 1;
  }
}

export function registerCrawlCommand(program: Command): void {
  program
    .command('crawl')
    .description('Faz o crawl de um site e gera o manifest')
    .argument('<url>', 'URL do site a ser analisado')
    .action(handleCrawlCommand);
}