import { processQueue } from '../queue';

export async function runQueueUseCase(): Promise<void> {
  await processQueue();
}