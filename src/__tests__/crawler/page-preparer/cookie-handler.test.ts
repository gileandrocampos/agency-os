import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { CookieHandler } from '../../../crawler/page-preparer/cookie-handler';

function makePageMock(clickResult: 'resolve' | 'reject') {
  return {
    locator: vi.fn().mockReturnValue({
      first: vi.fn().mockReturnValue({
        click:
          clickResult === 'resolve'
            ? vi.fn().mockResolvedValue(undefined)
            : vi.fn().mockRejectedValue(new Error('timeout')),
      }),
    }),
  } as unknown as Page;
}

describe('CookieHandler', () => {
  it('tem name igual a cookie-handler', () => {
    expect(new CookieHandler().name).toBe('cookie-handler');
  });

  it('retorna success:true com detalhe do seletor quando encontra banner', async () => {
    const handler = new CookieHandler();
    const result = await handler.run(makePageMock('resolve'));
    expect(result.success).toBe(true);
    expect(result.detail).toContain('Dismissed with:');
  });

  it('retorna success:true com mensagem de fallback quando nenhum banner é encontrado', async () => {
    const handler = new CookieHandler();
    const result = await handler.run(makePageMock('reject'));
    expect(result.success).toBe(true);
    expect(result.detail).toBe('No cookie banner found');
  });

  it('sempre retorna executed:true', async () => {
    const handler = new CookieHandler();
    const result = await handler.run(makePageMock('reject'));
    expect(result.executed).toBe(true);
  });
});
