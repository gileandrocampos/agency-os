// src/__tests__/cli/index.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../application/crawl-site.usecase', () => ({
  crawlSiteUseCase: vi.fn(),
}));

import { crawlSiteUseCase } from '../../application/crawl-site.usecase';
import { registerCrawlCommand } from '../../cli/commands/crawl.command';

describe('CLI - comando crawl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aciona crawlSiteUseCase ao rodar "crawl <url>"', async () => {
    (crawlSiteUseCase as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const program = new Command();
    program.exitOverride(); // evita que o Commander chame process.exit em erros
    registerCrawlCommand(program);

    await program.parseAsync(['node', 'script', 'crawl', 'https://example.com']);

    expect(crawlSiteUseCase).toHaveBeenCalledWith({ url: 'https://example.com' });
  });
});