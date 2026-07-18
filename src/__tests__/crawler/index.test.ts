import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserSession } from '../../crawler/browser';
import { loadPage } from '../../crawler/page-loader';
import { captureScreenshot } from '../../crawler/screenshot';
import { saveHtml } from '../../crawler/html-saver';
import { ensureDir } from '../../filesystem';
import { extractMetadata, parseSite } from '../../parser';
import { buildSiteManifest, saveSiteManifest } from '../../manifest-builder';
import { extractBranding } from '../../branding-extractor';
import { extractContacts } from '../../contact-extractor';
import { runCrawler } from '../../crawler/index';

const { mockClose, mockPage, mockSession, mockParsedSite, mockMetadata, mockSiteManifest, mockBranding, mockContacts } = vi.hoisted(() => {
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockPage = { content: vi.fn().mockResolvedValue('<html></html>') };
  const mockSession = { page: mockPage, close: mockClose };
  const mockParsedSite = {
    title: 'Test',
    description: null,
    language: null,
    headings: [],
    paragraphs: [],
    links: [],
    navigation: {
      mainMenu: [],
      footerMenu: [],
      internalLinks: [],
      externalLinks: [],
    },
    images: [],
  };
  const mockMetadata = {
    title: 'Test',
    description: 'Description',
    keywords: null,
    author: null,
    viewport: null,
    charset: null,
    robots: null,
    canonical: null,
    openGraph: {
      title: null,
      description: null,
      image: null,
      url: null,
      type: null,
      siteName: null,
    },
    twitterCard: {
      card: null,
      title: null,
      description: null,
      image: null,
    },
  };
  const mockSiteManifest = {
    schemaVersion: '1.0.0',
    source: {
      url: 'https://example.com/',
      domain: 'example.com',
      timestamp: '2026-01-01_00-00-00',
      outputDir: '/output/example.com_2026-01-01',
      artifacts: {
        htmlFile: '/out/page.html',
        screenshots: {
          desktop: '/out/screenshot-desktop.png',
          mobile: '/out/screenshot-mobile.png',
        },
      },
    },
    content: {
      language: null,
      headings: [],
      paragraphs: [],
      links: [],
      navigation: {
        mainMenu: [],
        footerMenu: [],
        internalLinks: [],
        externalLinks: [],
      },
      images: [],
      contact: {
        phones: [],
        whatsapp: [],
        emails: [],
        addresses: [],
        socialProfiles: [],
        maps: [],
        businessHours: [],
        forms: [],
        ctas: [],
        branches: [],
      },
    },
    analysis: {
      seo: { metadata: mockMetadata, audit: {} },
      ux: { audit: {} },
      performance: { audit: {} },
    },
    generators: {
      designSystem: {},
      wireframes: {},
    },
    integrations: {
      ai: {},
      googleMaps: {},
    },
    platform: {
      saas: {},
    },
  };
  const mockBranding = {
    logo: null,
    logoCandidates: [],
    favicon: null,
    palette: {
      primary: null,
      secondary: null,
      accent: null,
      background: null,
      surface: null,
      text: null,
      predominant: [],
      all: [],
    },
    fonts: [],
    iconLibrary: {
      primary: { name: 'unknown', confidence: 0, evidence: [] },
      detected: [],
    },
    cssFramework: { name: 'custom', confidence: 0.2, evidence: [] },
    theme: 'mixed',
    borderRadius: { predominant: null, values: [] },
    spacing: {
      predominantMargin: null,
      predominantPadding: null,
      predominantGap: null,
      margins: [],
      paddings: [],
      gaps: [],
    },
    components: [],
    buttons: {
      total: 0,
      classFrequency: [],
      predominantStyles: [],
      colors: [],
    },
  };
  const mockContacts = {
    phones: [{ raw: '(11) 99999-9999', normalized: '+5511999999999', source: 'text', confidence: 'high' }],
    whatsapp: [{ url: 'https://wa.me/5511999999999', phone: '+5511999999999', source: 'href', confidence: 'high' }],
    emails: [{ email: 'contato@example.com', source: 'href', confidence: 'high' }],
    addresses: [{ text: 'Rua Teste, 123 - Sao Paulo', source: 'footer', confidence: 'medium' }],
    socialProfiles: [{ platform: 'instagram', url: 'https://instagram.com/example', handle: 'example' }],
    maps: [{ url: 'https://maps.google.com/?q=-23.55,-46.63', source: 'href', coordinates: { lat: -23.55, lng: -46.63 } }],
    businessHours: [{ text: 'Segunda a Sexta 08:00 as 18:00', source: 'text' }],
    forms: [{ action: '/contato', method: 'POST', requiredFields: 2, fieldNames: ['name', 'email'], hasCaptcha: false }],
    ctas: [{ text: 'Fale conosco', href: '/contato' }],
    branches: [{ name: 'Matriz', address: 'Rua Teste, 123 - Sao Paulo', phones: ['+5511999999999'], emails: ['contato@example.com'] }],
  };
  return { mockClose, mockPage, mockSession, mockParsedSite, mockMetadata, mockSiteManifest, mockBranding, mockContacts };
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

vi.mock('../../parser', () => ({
  parseSite: vi.fn().mockReturnValue(mockParsedSite),
  extractMetadata: vi.fn().mockReturnValue(mockMetadata),
}));

vi.mock('../../manifest-builder', () => ({
  buildSiteManifest: vi.fn().mockReturnValue(mockSiteManifest),
  saveSiteManifest: vi.fn().mockResolvedValue('/out/site.json'),
}));

vi.mock('../../branding-extractor', () => ({
  extractBranding: vi.fn().mockResolvedValue(mockBranding),
}));

vi.mock('../../contact-extractor', () => ({
  extractContacts: vi.fn().mockReturnValue(mockContacts),
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

  it('retorna CrawlerResult com url, outputDir, paths e manifesto', async () => {
    const result = await runCrawler('https://example.com');
    expect(result).toMatchObject({
      url: 'https://example.com/',
      outputDir: '/output/example.com_2026-01-01',
      screenshotDesktop: '/out/screenshot-desktop.png',
      screenshotMobile: '/out/screenshot-mobile.png',
      htmlFile: '/out/page.html',
      siteJsonFile: '/out/site.json',
      siteManifest: mockSiteManifest,
      parsedSite: mockParsedSite,
      branding: mockBranding,
      contacts: mockContacts,
    });
  });

  it('chama extractContacts com html renderizado e baseUrl', async () => {
    await runCrawler('https://example.com');
    expect(extractContacts).toHaveBeenCalledOnce();
    expect(extractContacts).toHaveBeenCalledWith({
      html: '<html></html>',
      baseUrl: 'https://example.com/',
    });
  });

  it('chama extractBranding com a página ativa', async () => {
    await runCrawler('https://example.com');
    expect(extractBranding).toHaveBeenCalledOnce();
    expect(extractBranding).toHaveBeenCalledWith(mockPage);
  });

  it('chama createBrowserSession', async () => {
    await runCrawler('https://example.com');
    expect(createBrowserSession).toHaveBeenCalledOnce();
  });

  it('chama loadPage com a URL validada', async () => {
    await runCrawler('https://example.com');
    expect(loadPage).toHaveBeenCalledWith(mockPage, 'https://example.com/');
  });

  it('chama extractMetadata com o HTML renderizado', async () => {
    await runCrawler('https://example.com');
    expect(extractMetadata).toHaveBeenCalledOnce();
    expect(extractMetadata).toHaveBeenCalledWith('<html></html>');
  });

  it('chama buildSiteManifest com os dados consolidados', async () => {
    await runCrawler('https://example.com');

    expect(buildSiteManifest).toHaveBeenCalledOnce();
    expect(buildSiteManifest).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/',
      domain: 'example.com',
      timestamp: expect.any(String),
      outputDir: '/output/example.com_2026-01-01',
      htmlFile: '/out/page.html',
      screenshotDesktop: '/out/screenshot-desktop.png',
      screenshotMobile: '/out/screenshot-mobile.png',
      parsedSite: mockParsedSite,
      metadata: mockMetadata,
      branding: mockBranding,
      contacts: mockContacts,
    }));
  });

  it('chama saveSiteManifest uma vez', async () => {
    await runCrawler('https://example.com');
    expect(saveSiteManifest).toHaveBeenCalledOnce();
    expect(saveSiteManifest).toHaveBeenCalledWith(mockSiteManifest, '/output/example.com_2026-01-01');
  });

  it('chama captureScreenshot duas vezes (desktop e mobile)', async () => {
    await runCrawler('https://example.com');
    expect(captureScreenshot).toHaveBeenCalledTimes(2);
  });

  it('chama saveHtml uma vez', async () => {
    await runCrawler('https://example.com');
    expect(saveHtml).toHaveBeenCalledOnce();
    expect(saveHtml).toHaveBeenCalledWith('<html></html>', '/output/example.com_2026-01-01');
  });

  it('obtém o HTML da página apenas uma vez', async () => {
    await runCrawler('https://example.com');
    expect(mockPage.content).toHaveBeenCalledOnce();
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
