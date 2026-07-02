import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { WaitDomTask, DEFAULT_WAIT_DOM_OPTIONS } from '../../../../crawler/page-preparer/tasks/wait-dom';

function makeMockPage(): Partial<Page> & { evaluate: ReturnType<typeof vi.fn> } {
  return { evaluate: vi.fn().mockResolvedValue(undefined) };
}

describe('WaitDomTask', () => {
  it('chama page.evaluate exatamente uma vez', async () => {
    const page = makeMockPage();
    const task = new WaitDomTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledOnce();
  });

  it('passa as opções padrão como segundo argumento para page.evaluate', async () => {
    const page = makeMockPage();
    const task = new WaitDomTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), DEFAULT_WAIT_DOM_OPTIONS);
  });

  it('passa opções personalizadas para page.evaluate', async () => {
    const page = makeMockPage();
    const options = { idleMs: 100, timeoutMs: 2000 };
    const task = new WaitDomTask(options);
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), options);
  });

  it('resolve sem retorno quando page.evaluate é resolvido', async () => {
    const page = makeMockPage();
    const task = new WaitDomTask();
    await expect(task.run(page as Page)).resolves.toBeUndefined();
  });

  it('lança WaitDomTask failed quando page.evaluate rejeita com Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue(new Error('dom timeout'));
    const task = new WaitDomTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitDomTask failed: dom timeout');
  });

  it('lança WaitDomTask failed quando page.evaluate rejeita com valor não-Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue('falha inesperada');
    const task = new WaitDomTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitDomTask failed: falha inesperada');
  });
});
