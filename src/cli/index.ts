#!/usr/bin/env node
import { Command } from 'commander';
import { registerCrawlCommand } from './commands/crawl.command';

const program = new Command();

program
  .name('agency-os')
  .description('Automatizador de criação de sites, análise, curadoria e busca de leads')
  .version('0.1.0');

registerCrawlCommand(program);
program.parseAsync(process.argv);