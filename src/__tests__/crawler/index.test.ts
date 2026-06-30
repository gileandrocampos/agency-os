import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserSession } from '../../crawler/browser';
import { loadPage } from '../../crawler/page-loader';
import { captureScreenshot } from '../../crawler/screenshot';
import { saveHtml } from '../../crawler/html-saver';
import { ensureDir } from '../../filesystem';
import { runCrawler } from '../../crawler/index';

const { mockClose, mockPage, mockSession } = vi.hoisted(() => {
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockPage = {};
  const mockSession = { page: mockPage, close: mockClose };
  return { mockClose, mockPage, mockSession };
});

vi.mock('../../crawler/browser', () => ({
  createBrowserSession: vi.fn().mockResolvedValue(mockSession),
}));

vi.mock('../../crawler/page-loader', () => ({
  loadPage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../crawler/screenshot', () => ({
  captureScreenshot: vi
    .fn()
    .mockResolvedValueOnce('/out/screenshot-desktop.png')
    .mockResolvedValueOnce('/out/screenshot-mobile.png'),
}));

vi.mock('../../crawler/html-saver', () => ({
  saveHtml: vi.fn().mockResolvedValue('/out/page.html'),
}));

vi.mock('../../logger', () => ({
  initLogger: vi.fn(),
  logStart: vi.fn(),
  logUrl: vi.fn(),
  logDir: vi.fn(),
  logBrowser: vi.fn(),
  logPage: vi.fn(),
  logScreenshot: vi.fn(),
  logSave: vi.fn(),
  logSuccess: vi.fn(),
  logPrepare: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../filesystem', () => ({
  ensureDir: vi.fn(),
  buildSessionDir: vi.fn().mockReturnValue('/output/example.com_2026-01-01'),
}));

describe('runCrawler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (captureScreenshot as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('/out/screenshot-desktop.png')
      .mockResolvedValueOnce('/out/screenshot-mobile.png');
    (saveHtml as ReturnType<typeof vi.fn>).mockResolvedValue('/out/page.html');
    mockClose.mockResolvedValue(undefined);
  });

  it('retorna CrawlerResult com url, outputDir e caminhos de arquivos', async () => {
    const result = await runCrawler('https://example.com');
    expect(result).toMatchObject({
      url: 'https://example.com/',
      outputDir: '/output/example.com_2026-01-01',
      screenshotDesktop: '/out/screenshot-desktop.png',
      screenshotMobile: '/out/screenshot-mobile.png',
      htmlFile: '/out/page.html',
    });
  });

  it('chama createBrowserSession', async () => {
    await runCrawler('https://example.com');
    expect(createBrowserSession).toHaveBeenCalledOnce();
  });

  it('chama loadPage com a URL validada', async () => {
    await runCrawler('https://example.com');
    expect(loadPage).toHaveBeenCalledWith(mockPage, 'https://example.com/');
  });

  it('chama captureScreenshot duas vezes (desktop e mobile)', async () => {
    await runCrawler('https://example.com');
    expect(captureScreenshot).toHaveBeenCalledTimes(2);
  });

  it('chama saveHtml uma vez', async () => {
    await runCrawler('https://example.com');
    expect(saveHtml).toHaveBeenCalledOnce();
  });

  it('chama session.close() ao final (finally)', async () => {
    await runCrawler('https://example.com');
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('chama ensureDir para logsDir e outputDir', async () => {
    await runCrawler('https://example.com');
    expect(ensureDir).toHaveBeenCalledTimes(2);
  });

  it('lança erro se URL for inválida', async () => {
    await expect(runCrawler('nao-e-url')).rejects.toThrow(/URL inválida/);
  });

  it('chama session.close() mesmo quando loadPage lança erro', async () => {
    (loadPage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('falha'));
    await expect(runCrawler('https://example.com')).rejects.toThrow('falha');
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
