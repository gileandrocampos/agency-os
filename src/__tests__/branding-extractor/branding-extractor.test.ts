import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { BrandingExtractorService, extractBranding } from '../../branding-extractor';

type MockedPage = { evaluate: ReturnType<typeof vi.fn> };

function makeMockPage(): MockedPage {
  return { evaluate: vi.fn() };
}

describe('BrandingExtractorService', () => {
  it('retorna objeto tipado com logo, paleta, fontes e componentes', async () => {
    const page = makeMockPage();

    page.evaluate
      .mockResolvedValueOnce([
        { url: 'https://example.com/logo.svg', selector: 'header img', strategy: 'header-image', width: 240, height: 64 },
      ])
      .mockResolvedValueOnce('https://example.com/favicon.ico')
      .mockResolvedValueOnce([
        {
          color: 'rgb(34, 34, 34)',
          backgroundColor: 'rgb(255, 255, 255)',
          borderColor: 'rgb(230, 230, 230)',
          borderRadius: '8px',
          margin: '0px',
          padding: '16px',
          gap: '8px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          interactive: false,
          surface: true,
        },
        {
          color: 'rgb(255, 255, 255)',
          backgroundColor: 'rgb(0, 86, 255)',
          borderColor: 'rgb(0, 86, 255)',
          borderRadius: '999px',
          margin: '0px',
          padding: '12px 16px',
          gap: '0px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          interactive: true,
          surface: false,
        },
      ])
      .mockResolvedValueOnce({
        stylesheetUrls: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'],
        scriptUrls: ['https://example.com/app.js'],
        resourceUrls: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'],
        classNames: ['container', 'row', 'btn', 'btn-primary'],
        fontFaces: [{ family: 'Inter', weight: '400', source: 'url(https://fonts.gstatic.com/s/inter.woff2)' }],
        svgCount: 3,
      })
      .mockResolvedValueOnce([
        { name: 'navbar', count: 1, present: true },
        { name: 'hero', count: 1, present: true },
      ])
      .mockResolvedValueOnce([
        {
          classes: ['btn', 'btn-primary'],
          backgroundColor: 'rgb(0, 86, 255)',
          textColor: 'rgb(255, 255, 255)',
          borderRadius: '999px',
        },
      ]);

    const extractor = new BrandingExtractorService();
    const result = await extractor.extract(page as unknown as Page);

    expect(result.logo?.url).toBe('https://example.com/logo.svg');
    expect(result.favicon).toBe('https://example.com/favicon.ico');
    expect(result.palette.primary).toBe('#0056ff');
    expect(result.cssFramework.name).toBe('bootstrap');
    expect(result.theme).toBe('light');
    expect(result.fonts[0]).toMatchObject({ family: 'Inter', origin: 'google-fonts' });
    expect(result.buttons.total).toBe(1);
  });

  it('usa favicon como fallback quando não encontra logo no DOM', async () => {
    const page = makeMockPage();

    page.evaluate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce('https://example.com/favicon.ico')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        stylesheetUrls: [],
        scriptUrls: [],
        resourceUrls: [],
        classNames: [],
        fontFaces: [],
        svgCount: 0,
      })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await extractBranding(page as unknown as Page);

    expect(result.logo).toMatchObject({
      url: 'https://example.com/favicon.ico',
      strategy: 'favicon-fallback',
    });
    expect(result.logoCandidates).toEqual([]);
  });

  it('propaga erro quando page.evaluate falha', async () => {
    const page = makeMockPage();
    page.evaluate.mockRejectedValue(new Error('falha no evaluate'));

    await expect(extractBranding(page as unknown as Page)).rejects.toThrow('falha no evaluate');
  });
});
