import { describe, it, expect, vi } from 'vitest';
import { createHumanizedDelay } from '../../../crawler/anti-bot/humanized-delay';

describe('createHumanizedDelay', () => {
  it('retorna 0 e não executa sleep quando desativado', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const delay = createHumanizedDelay({ enabled: false, minMs: 300, maxMs: 1200 }, () => 0.5, sleep);

    const selectedDelay = await delay();

    expect(selectedDelay).toBe(0);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('executa sleep dentro do intervalo configurado', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const delay = createHumanizedDelay({ enabled: true, minMs: 300, maxMs: 1200 }, () => 0, sleep);

    const selectedDelay = await delay();

    expect(selectedDelay).toBe(300);
    expect(sleep).toHaveBeenCalledWith(300);
  });
});
