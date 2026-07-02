import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';
import { saveHtml } from '../../crawler/html-saver';

vi.mock('fs');

function makeMockPage(html = '<html><body>conteúdo</body></html>'): Partial<Page> & {
  content: ReturnType<typeof vi.fn>;
} {
  return { content: vi.fn().mockResolvedValue(html) };
}

describe('saveHtml', () => {
  let writeFileSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeFileSyncMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    writeFileSyncMock.mockRestore();
  });

  it('chama page.content() para obter o HTML', async () => {
    const page = makeMockPage();
    await saveHtml(page as Page, '/out');
    expect(page.content).toHaveBeenCalledOnce();
  });

  it('salva o HTML com fs.writeFileSync', async () => {
    const html = '<html><body>test</body></html>';
    const page = makeMockPage(html);
    await saveHtml(page as Page, '/out');
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      path.join('/out', 'page.html'),
      html,
      'utf-8',
    );
  });

  it('retorna o caminho do arquivo page.html', async () => {
    const page = makeMockPage();
    const result = await saveHtml(page as Page, '/out');
    expect(result).toBe(path.join('/out', 'page.html'));
  });

  it('retorna caminho dentro do outputDir informado', async () => {
    const page = makeMockPage();
    const result = await saveHtml(page as Page, '/custom/output');
    expect(result).toContain('custom');
    expect(result).toContain('page.html');
  });

  it('propaga erro lançado por page.content()', async () => {
    const page = makeMockPage();
    page.content.mockRejectedValue(new Error('falha ao obter conteúdo'));
    await expect(saveHtml(page as Page, '/out')).rejects.toThrow('falha ao obter conteúdo');
  });
});
