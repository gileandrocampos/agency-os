import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { WaitFontsTask, DEFAULT_WAIT_FONTS_OPTIONS } from '../../../../crawler/page-preparer/tasks/wait-fonts';

function makeMockPage(): Partial<Page> & { evaluate: ReturnType<typeof vi.fn> } {
  return { evaluate: vi.fn().mockResolvedValue(undefined) };
}

describe('WaitFontsTask', () => {
  it('chama page.evaluate exatamente uma vez', async () => {
    const page = makeMockPage();
    const task = new WaitFontsTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledOnce();
  });

  it('passa as opções padrão como segundo argumento para page.evaluate', async () => {
    const page = makeMockPage();
    const task = new WaitFontsTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), DEFAULT_WAIT_FONTS_OPTIONS);
  });

  it('passa opções personalizadas para page.evaluate', async () => {
    const page = makeMockPage();
    const options = { timeoutMs: 3000 };
    const task = new WaitFontsTask(options);
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), options);
  });

  it('resolve sem retorno quando page.evaluate é resolvido', async () => {
    const page = makeMockPage();
    const task = new WaitFontsTask();
    await expect(task.run(page as Page)).resolves.toBeUndefined();
  });

  it('lança WaitFontsTask failed quando page.evaluate rejeita com Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue(new Error('fontes não carregadas'));
    const task = new WaitFontsTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitFontsTask failed: fontes não carregadas');
  });

  it('lança WaitFontsTask failed quando page.evaluate rejeita com valor não-Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue('timeout de fontes');
    const task = new WaitFontsTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitFontsTask failed: timeout de fontes');
  });
});
