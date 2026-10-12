import { enqueue } from '../queue';
import type { JobPriority } from '../queue';

export interface EnqueueSitesInput {
  urls: string[];
  priority?: JobPriority;
  max_attempts?: number;
}

export function enqueueSitesUseCase(input: EnqueueSitesInput) {
  return input.urls.map((url) => enqueue({
    url,
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.max_attempts === undefined ? {} : { max_attempts: input.max_attempts }),
  }));
}
