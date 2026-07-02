import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { WaitImagesTask, DEFAULT_WAIT_IMAGES_OPTIONS } from '../../../../crawler/page-preparer/tasks/wait-images';

function makeMockPage(): Partial<Page> & { evaluate: ReturnType<typeof vi.fn> } {
  return { evaluate: vi.fn().mockResolvedValue(undefined) };
}

describe('WaitImagesTask', () => {
  it('chama page.evaluate exatamente uma vez', async () => {
    const page = makeMockPage();
    const task = new WaitImagesTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledOnce();
  });

  it('passa as opções padrão como segundo argumento para page.evaluate', async () => {
    const page = makeMockPage();
    const task = new WaitImagesTask();
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), DEFAULT_WAIT_IMAGES_OPTIONS);
  });

  it('passa opções personalizadas para page.evaluate', async () => {
    const page = makeMockPage();
    const options = { timeoutMs: 5000 };
    const task = new WaitImagesTask(options);
    await task.run(page as Page);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), options);
  });

  it('resolve sem retorno quando page.evaluate é resolvido', async () => {
    const page = makeMockPage();
    const task = new WaitImagesTask();
    await expect(task.run(page as Page)).resolves.toBeUndefined();
  });

  it('lança WaitImagesTask failed quando page.evaluate rejeita com Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue(new Error('imagens não carregadas'));
    const task = new WaitImagesTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitImagesTask failed: imagens não carregadas');
  });

  it('lança WaitImagesTask failed quando page.evaluate rejeita com valor não-Error', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue('timeout de imagens');
    const task = new WaitImagesTask();
    await expect(task.run(page as Page)).rejects.toThrow('WaitImagesTask failed: timeout de imagens');
  });
});
