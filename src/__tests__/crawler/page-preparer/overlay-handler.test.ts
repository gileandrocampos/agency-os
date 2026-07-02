import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { OverlayHandler } from '../../../crawler/page-preparer/overlay-handler';

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

describe('OverlayHandler', () => {
  it('tem name igual a overlay-handler', () => {
    expect(new OverlayHandler().name).toBe('overlay-handler');
  });

  it('retorna success:true com detalhe do seletor quando encontra overlay', async () => {
    const handler = new OverlayHandler();
    const result = await handler.run(makePageMock('resolve'));
    expect(result.success).toBe(true);
    expect(result.detail).toContain('Dismissed with:');
  });

  it('retorna success:true com mensagem de fallback quando nenhum overlay é encontrado', async () => {
    const handler = new OverlayHandler();
    const result = await handler.run(makePageMock('reject'));
    expect(result.success).toBe(true);
    expect(result.detail).toBe('No overlay found');
  });

  it('sempre retorna executed:true', async () => {
    const handler = new OverlayHandler();
    const result = await handler.run(makePageMock('reject'));
    expect(result.executed).toBe(true);
  });
});
