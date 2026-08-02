import { enqueue } from '../queue';

export interface EnqueueSitesInput {
  urls: string[];
}

export function enqueueSitesUseCase(input: EnqueueSitesInput) {
  return input.urls.map((url) => enqueue({ url }));
}