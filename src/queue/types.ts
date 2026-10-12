export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export type JobPriority = 'low' | 'normal' | 'high';

export interface CrawlJobConfig {
  userAgent?: string;
  timeoutMs?: number;
}

export interface Job {
  id: string;
  url: string;
  company_name: string | null;
  priority: JobPriority;
  config: CrawlJobConfig | null;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}