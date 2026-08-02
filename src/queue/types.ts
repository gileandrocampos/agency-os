export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface Job {
  id: string;
  url: string;
  company_name: string | null;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}