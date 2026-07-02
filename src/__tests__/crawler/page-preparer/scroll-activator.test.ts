import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { ScrollActivator } from '../../../crawler/page-preparer/scroll-activator';

function makePageMock(scrollHeight = 1000, viewportHeight = 500) {
  return {
    evaluate: vi.fn()
      .mockResolvedValueOnce(scrollHeight)
      .mockResolvedValue(undefined),
    viewportSize: vi.fn().mockReturnValue({ height: viewportHeight, width: 1280 }),
  } as unknown as Page;
}

describe('ScrollActivator', () => {
  it('tem name igual a scroll-activator', () => {
    expect(new ScrollActivator(300, 20).name).toBe('scroll-activator');
  });

  it('aceita scrollDelay e maxScrollSteps no constructor sem lançar erros', () => {
    expect(() => new ScrollActivator(500, 10)).not.toThrow();
  });

  it('retorna success:true e informa quantos steps foram executados', async () => {
    const activator = new ScrollActivator(0, 20);
    const result = await activator.run(makePageMock(1000, 500));
    expect(result.success).toBe(true);
    expect(result.detail).toContain('steps');
  });

  it('limita ao maxScrollSteps quando a página é muito longa', async () => {
    const activator = new ScrollActivator(0, 3);
    const result = await activator.run(makePageMock(10000, 500));
    expect(result.success).toBe(true);
    expect(result.detail).toBe('Scrolled 3 steps');
  });

  it('retorna success:false quando evaluate lança erro', async () => {
    const page = {
      evaluate: vi.fn().mockRejectedValue(new Error('evaluate fail')),
      viewportSize: vi.fn().mockReturnValue({ height: 500, width: 1280 }),
    } as unknown as Page;
    const activator = new ScrollActivator(0, 5);
    const result = await activator.run(page);
    expect(result.success).toBe(false);
    expect(result.detail).toContain('evaluate fail');
  });
});
