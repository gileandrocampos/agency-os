import { describe, it, expect, beforeEach, vi } from 'vitest';

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id            TEXT PRIMARY KEY,
      url           TEXT NOT NULL UNIQUE,
      company_name  TEXT,
      status        TEXT NOT NULL DEFAULT 'pending',
      attempts      INTEGER DEFAULT 0,
      max_attempts  INTEGER DEFAULT 1,
      error         TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    )
  `);
  return { testDb: db };
});

vi.mock('../../queue/storage', () => ({ db: testDb }));

import { enqueue, list, getNext, markDone, markFailed, countPending, findByUrl } from '../../queue/queue';

describe('enqueue', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('cria um novo job e retorna created: true', () => {
    const result = enqueue({ url: 'https://example.com' });

    expect(result.created).toBe(true);
    if (!result.created) return;
    expect(result.job.url).toBe('https://example.com');
    expect(result.job.status).toBe('pending');
    expect(result.job.attempts).toBe(0);
    expect(result.job.max_attempts).toBe(1);
    expect(result.job.company_name).toBeNull();
    expect(result.job.error).toBeNull();
  });

  it('persiste company_name e max_attempts informados', () => {
    const result = enqueue({ url: 'https://example.com', company_name: 'Acme', max_attempts: 3 });

    expect(result.created).toBe(true);
    if (!result.created) return;
    expect(result.job.company_name).toBe('Acme');
    expect(result.job.max_attempts).toBe(3);
  });

  it('retorna created: false com o job existente em caso de URL duplicada', () => {
    enqueue({ url: 'https://example.com' });
    const result = enqueue({ url: 'https://example.com' });

    expect(result.created).toBe(false);
    if (result.created) return;
    expect(result.reason).toBe('duplicate');
    expect(result.existingJob.url).toBe('https://example.com');
  });
});

describe('list', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('retorna todos os jobs quando sem filtro', () => {
    enqueue({ url: 'https://a.com' });
    enqueue({ url: 'https://b.com' });

    const jobs = list();
    expect(jobs).toHaveLength(2);
  });

  it('filtra jobs por status', () => {
    enqueue({ url: 'https://a.com' });
    const jobB = enqueue({ url: 'https://b.com' });
    if (!jobB.created) return;
    markDone(jobB.job.id);

    const pending = list({ status: 'pending' });
    const done = list({ status: 'done' });

    expect(pending).toHaveLength(1);
    expect(pending[0].url).toBe('https://a.com');
    expect(done).toHaveLength(1);
    expect(done[0].url).toBe('https://b.com');
  });

  it('retorna lista vazia quando nenhum job existe', () => {
    expect(list()).toHaveLength(0);
  });
});

describe('getNext', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('retorna null quando não há jobs pendentes', () => {
    expect(getNext()).toBeNull();
  });

  it('retorna o job mais antigo e muda status para running', () => {
    enqueue({ url: 'https://first.com' });
    enqueue({ url: 'https://second.com' });

    const job = getNext();
    expect(job).not.toBeNull();
    expect(job!.url).toBe('https://first.com');
    expect(job!.status).toBe('running');
  });

  it('não retorna o mesmo job duas vezes consecutivas', () => {
    enqueue({ url: 'https://only.com' });
    getNext();

    expect(getNext()).toBeNull();
  });
});

describe('markDone', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('atualiza o status para done', () => {
    const result = enqueue({ url: 'https://example.com' });
    if (!result.created) return;

    markDone(result.job.id);

    const job = findByUrl('https://example.com');
    expect(job!.status).toBe('done');
  });
});

describe('markFailed', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('muda para failed quando esgotadas todas as tentativas', () => {
    const result = enqueue({ url: 'https://example.com', max_attempts: 1 });
    if (!result.created) return;

    markFailed(result.job.id, 'timeout');

    const job = findByUrl('https://example.com');
    expect(job!.status).toBe('failed');
    expect(job!.attempts).toBe(1);
    expect(job!.error).toBe('timeout');
  });

  it('volta para pending e incrementa tentativas quando ainda há retries', () => {
    const result = enqueue({ url: 'https://example.com', max_attempts: 3 });
    if (!result.created) return;

    markFailed(result.job.id, 'timeout');

    const job = findByUrl('https://example.com');
    expect(job!.status).toBe('pending');
    expect(job!.attempts).toBe(1);
  });

  it('lança erro quando o id não existe', () => {
    expect(() => markFailed('id-inexistente', 'erro')).toThrow('id-inexistente');
  });
});

describe('countPending', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('retorna o total de jobs pendentes', () => {
    enqueue({ url: 'https://a.com' });
    enqueue({ url: 'https://b.com' });

    expect(countPending()).toBe(2);
  });

  it('não conta jobs com outros status', () => {
    const result = enqueue({ url: 'https://a.com' });
    if (!result.created) return;
    markDone(result.job.id);

    expect(countPending()).toBe(0);
  });
});

describe('findByUrl', () => {
  beforeEach(() => {
    testDb.prepare('DELETE FROM jobs').run();
  });

  it('retorna o job correspondente à URL', () => {
    enqueue({ url: 'https://example.com' });

    const job = findByUrl('https://example.com');
    expect(job).toBeDefined();
    expect(job!.url).toBe('https://example.com');
  });

  it('retorna undefined quando URL não existe', () => {
    expect(findByUrl('https://nao-existe.com')).toBeUndefined();
  });
});
