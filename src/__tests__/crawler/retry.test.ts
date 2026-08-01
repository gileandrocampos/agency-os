import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, isRetryableError } from '../../crawler/retry';

vi.mock('../../logger', () => ({
  logRetry: vi.fn(),
}));

import { logRetry } from '../../logger';

const noSleep = vi.fn().mockResolvedValue(undefined);

describe('isRetryableError', () => {
  it('retorna true para erro de timeout', () => {
    expect(isRetryableError(new Error('Timeout exceeded'))).toBe(true);
  });

  it('retorna true para erro de rede net::', () => {
    expect(isRetryableError(new Error('net::ERR_CONNECTION_REFUSED'))).toBe(true);
  });

  it('retorna true para erro de target closed', () => {
    expect(isRetryableError(new Error('Target closed'))).toBe(true);
  });

  it('retorna true para erro de page closed', () => {
    expect(isRetryableError(new Error('Page closed'))).toBe(true);
  });

  it('retorna true para context was destroyed', () => {
    expect(isRetryableError(new Error('context was destroyed'))).toBe(true);
  });

  it('retorna true para navigation failed', () => {
    expect(isRetryableError(new Error('Navigation failed because page crashed'))).toBe(true);
  });

  it('retorna false para erro de parsing (não transitório)', () => {
    expect(isRetryableError(new Error('Cannot read property of undefined'))).toBe(false);
  });

  it('retorna false para erro de validação de URL', () => {
    expect(isRetryableError(new Error('URL inválida'))).toBe(false);
  });

  it('retorna false para valor não-Error', () => {
    expect(isRetryableError('string error')).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(42)).toBe(false);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna resultado na primeira tentativa bem-sucedida', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await withRetry(fn, { maxAttempts: 3, backoffMs: 100 }, noSleep);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('tenta novamente após erro transitório e retorna na segunda tentativa', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('net::ERR_CONNECTION_RESET'))
      .mockResolvedValueOnce('sucesso na segunda');

    const result = await withRetry(fn, { maxAttempts: 3, backoffMs: 100 }, noSleep);

    expect(result).toBe('sucesso na segunda');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(noSleep).toHaveBeenCalledOnce();
    expect(noSleep).toHaveBeenCalledWith(100);
    expect(logRetry).toHaveBeenCalledOnce();
  });

  it('aguarda backoff multiplicado pelo número da tentativa', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Timeout exceeded'))
      .mockRejectedValueOnce(new Error('Timeout exceeded'))
      .mockResolvedValueOnce('ok na terceira');

    await withRetry(fn, { maxAttempts: 3, backoffMs: 500 }, noSleep);

    expect(noSleep).toHaveBeenCalledTimes(2);
    expect(noSleep).toHaveBeenNthCalledWith(1, 500);
    expect(noSleep).toHaveBeenNthCalledWith(2, 1000);
  });

  it('lança erro descritivo após esgotar todas as tentativas', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('net::ERR_NAME_NOT_RESOLVED'));

    await expect(
      withRetry(fn, { maxAttempts: 3, backoffMs: 100 }, noSleep),
    ).rejects.toThrow('Crawl falhou após 3 tentativa(s): net::ERR_NAME_NOT_RESOLVED');

    expect(fn).toHaveBeenCalledTimes(3);
    expect(noSleep).toHaveBeenCalledTimes(2);
  });

  it('propaga erro fatal imediatamente sem retry', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('URL inválida: protocolo não suportado'));

    await expect(
      withRetry(fn, { maxAttempts: 3, backoffMs: 100 }, noSleep),
    ).rejects.toThrow('Crawl falhou após 1 tentativa(s): URL inválida: protocolo não suportado');

    expect(fn).toHaveBeenCalledOnce();
    expect(noSleep).not.toHaveBeenCalled();
    expect(logRetry).not.toHaveBeenCalled();
  });

  it('loga cada tentativa com retry antes de dormir', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Target closed'))
      .mockResolvedValueOnce('ok');

    await withRetry(fn, { maxAttempts: 3, backoffMs: 200 }, noSleep);

    expect(logRetry).toHaveBeenCalledOnce();
    expect((logRetry as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatch(/Tentativa 1\/3/);
  });

  it('funciona com maxAttempts igual a 1 (sem retry possível)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Timeout exceeded'));

    await expect(
      withRetry(fn, { maxAttempts: 1, backoffMs: 100 }, noSleep),
    ).rejects.toThrow('Crawl falhou após 1 tentativa(s)');

    expect(fn).toHaveBeenCalledOnce();
    expect(noSleep).not.toHaveBeenCalled();
    expect(logRetry).not.toHaveBeenCalled();
  });

  it('falha cedo quando maxAttempts é inválido', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(withRetry(fn, { maxAttempts: 0, backoffMs: 100 }, noSleep)).rejects.toThrow(
      'Configuração de retry inválida: maxAttempts deve ser um inteiro maior ou igual a 1',
    );

    expect(fn).not.toHaveBeenCalled();
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('falha cedo quando backoffMs é inválido', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(withRetry(fn, { maxAttempts: 3, backoffMs: -1 }, noSleep)).rejects.toThrow(
      'Configuração de retry inválida: backoffMs deve ser maior ou igual a 0',
    );

    expect(fn).not.toHaveBeenCalled();
    expect(noSleep).not.toHaveBeenCalled();
  });
});
