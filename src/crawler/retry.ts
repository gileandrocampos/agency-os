import { logRetry } from '../logger';

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
}

const RETRYABLE_PATTERNS = [
  /net::/i,
  /timeout/i,
  /target closed/i,
  /page closed/i,
  /context was destroyed/i,
  /navigation failed/i,
  /frame was detached/i,
];

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return RETRYABLE_PATTERNS.some((pattern) => pattern.test(error.message));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateRetryOptions(options: RetryOptions): void {
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new Error('Configuração de retry inválida: maxAttempts deve ser um inteiro maior ou igual a 1');
  }

  if (!Number.isFinite(options.backoffMs) || options.backoffMs < 0) {
    throw new Error('Configuração de retry inválida: backoffMs deve ser maior ou igual a 0');
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<T> {
  validateRetryOptions(options);
  const { maxAttempts, backoffMs } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxAttempts;

      if (isLast || !isRetryableError(error)) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Crawl falhou após ${attempt} tentativa(s): ${message}`);
      }

      logRetry(`Tentativa ${attempt}/${maxAttempts} falhou — aguardando ${backoffMs * attempt}ms antes de tentar novamente`);
      await sleep(backoffMs * attempt);
    }
  }

  // unreachable, but TypeScript needs it
  throw new Error('Crawl falhou: nenhuma tentativa executada');
}
