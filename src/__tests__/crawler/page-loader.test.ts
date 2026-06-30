import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { loadPage } from '../../crawler/page-loader';

function makeMockPage(): Partial<Page> & { goto: ReturnType<typeof vi.fn> } {
  return { goto: vi.fn().mockResolvedValue(null) };
}

describe('loadPage', () => {
  it('chama page.goto com a URL fornecida', async () => {
    const page = makeMockPage();
    await loadPage(page as Page, 'https://example.com');
    expect(page.goto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  });

  it('chama page.goto com waitUntil: networkidle', async () => {
    const page = makeMockPage();
    await loadPage(page as Page, 'https://site.com');
    const options = page.goto.mock.calls[0][1];
    expect(options.waitUntil).toBe('networkidle');
  });

  it('chama page.goto com timeout de 30000ms', async () => {
    const page = makeMockPage();
    await loadPage(page as Page, 'https://site.com');
    const options = page.goto.mock.calls[0][1];
    expect(options.timeout).toBe(30000);
  });

  it('chama page.goto exatamente uma vez', async () => {
    const page = makeMockPage();
    await loadPage(page as Page, 'https://example.com');
    expect(page.goto).toHaveBeenCalledOnce();
  });

  it('propaga erro lançado por page.goto', async () => {
    const page = makeMockPage();
    page.goto.mockRejectedValue(new Error('timeout'));
    await expect(loadPage(page as Page, 'https://example.com')).rejects.toThrow('timeout');
  });
});
