import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { saveHtml } from '../../crawler/html-saver';

vi.mock('fs');

describe('saveHtml', () => {
  let writeFileSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeFileSyncMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    writeFileSyncMock.mockRestore();
  });

  it('salva o HTML com fs.writeFileSync', async () => {
    const html = '<html><body>test</body></html>';
    await saveHtml(html, '/out');
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      path.join('/out', 'page.html'),
      html,
      'utf-8',
    );
  });

  it('retorna o caminho do arquivo page.html', async () => {
    const result = await saveHtml('<html><body>conteúdo</body></html>', '/out');
    expect(result).toBe(path.join('/out', 'page.html'));
  });

  it('retorna caminho dentro do outputDir informado', async () => {
    const result = await saveHtml('<html><body>conteúdo</body></html>', '/custom/output');
    expect(result).toContain('custom');
    expect(result).toContain('page.html');
  });
});
