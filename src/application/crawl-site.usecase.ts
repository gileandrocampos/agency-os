import { runCrawler } from '../crawler';

export interface CrawlSiteInput {
  url: string;
}

export async function crawlSiteUseCase(input: CrawlSiteInput): Promise<void> {
  await runCrawler(input.url);
}