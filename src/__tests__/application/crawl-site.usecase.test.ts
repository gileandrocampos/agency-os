import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../crawler', () => ({
  runCrawler: vi.fn(),
}));

import { runCrawler } from '../../crawler';
import { crawlSiteUseCase } from '../../application/crawl-site.usecase';

describe('crawlSiteUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delega para runCrawler com a url informada', async () => {
    (runCrawler as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await crawlSiteUseCase({ url: 'https://example.com' });

    expect(runCrawler).toHaveBeenCalledWith('https://example.com');
  });

  it('propaga erros lançados por runCrawler', async () => {
    const err = new Error('falha no crawl');
    (runCrawler as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    await expect(crawlSiteUseCase({ url: 'https://example.com' })).rejects.toThrow(err);
  });
});