import { processQueue } from '../queue';
import { runCrawler } from '../crawler';

export async function runQueueUseCase(): Promise<void> {
  await processQueue(runCrawler);
}