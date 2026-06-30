import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { IdleWaiter } from '../../../crawler/page-preparer/idle-waiter';
import type { WaitDomTask } from '../../../crawler/page-preparer/tasks/wait-dom';
import type { WaitFontsTask } from '../../../crawler/page-preparer/tasks/wait-fonts';
import type { WaitImagesTask } from '../../../crawler/page-preparer/tasks/wait-images';

function makeTaskMock() {
  return { run: vi.fn().mockResolvedValue(undefined) };
}

function makePageMock() {
  return {
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
  } as unknown as Page;
}

describe('IdleWaiter', () => {
  it('tem name igual a idle-waiter', () => {
    expect(new IdleWaiter(5000).name).toBe('idle-waiter');
  });

  it('aceita networkIdleTimeout no constructor sem lançar erros', () => {
    expect(() => new IdleWaiter(3000)).not.toThrow();
  });

  it('executa todas as sub-tasks em sequência', async () => {
    const dom = makeTaskMock();
    const fonts = makeTaskMock();
    const images = makeTaskMock();
    const waiter = new IdleWaiter(
      5000,
      dom as unknown as WaitDomTask,
      fonts as unknown as WaitFontsTask,
      images as unknown as WaitImagesTask,
    );
    const result = await waiter.run(makePageMock());
    expect(dom.run).toHaveBeenCalledOnce();
    expect(fonts.run).toHaveBeenCalledOnce();
    expect(images.run).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
  });

  it('retorna success:false quando uma sub-task lança erro', async () => {
    const dom = { run: vi.fn().mockRejectedValue(new Error('dom fail')) };
    const fonts = makeTaskMock();
    const images = makeTaskMock();
    const waiter = new IdleWaiter(
      5000,
      dom as unknown as WaitDomTask,
      fonts as unknown as WaitFontsTask,
      images as unknown as WaitImagesTask,
    );
    const result = await waiter.run(makePageMock());
    expect(result.success).toBe(false);
    expect(result.detail).toContain('dom fail');
  });
});
