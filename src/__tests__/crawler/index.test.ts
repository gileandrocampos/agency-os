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
import { detectChallenge } from '../../crawler/anti-bot/challenge-detector';
import { recordDomainAttempt, recordDomainBlock } from '../../filesystem';

const {
  mockClose,
  mockPage,
  mockSession,
  mockParsedSite,
  mockMetadata,
  mockSiteManifest,
  mockBranding,
  mockContacts,
  mockConfigService,
} = vi.hoisted(() => {
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
  const mockConfigService = {
    read: vi.fn().mockResolvedValue({
      storage: {
        logsDir: '/logs',
        outputDir: '/output',
      },
      browser: {
        headless: false,
        slowMoMs: 0,
        antiBot: {
          enabled: true,
          stealth: true,
          rotateFingerprint: true,
          fingerprints: [],
          humanizedDelay: {
            enabled: false,
            minMs: 0,
            maxMs: 0,
          },
          challengeDetection: {
            enabled: true,
            patterns: ['cloudflare'],
          },
          blockMetrics: {
            enabled: true,
            fileName: 'block-metrics.json',
          },
        },
      },
      network: {},
      locale: {},
      logging: {},
      terminal: {},
      integrations: {},
      retry: {
        maxAttempts: 1,
        backoffMs: 0,
      },
    }),
    write: vi.fn(),
  };
  return {
    mockClose,
    mockPage,
    mockSession,
    mockParsedSite,
    mockMetadata,
    mockSiteManifest,
    mockBranding,
    mockContacts,
    mockConfigService,
  };
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

vi.mock('../../crawler/anti-bot/challenge-detector', () => ({
  detectChallenge: vi.fn().mockResolvedValue(null),
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
  logRetry: vi.fn(),
}));

vi.mock('../../filesystem', () => ({
  ensureDir: vi.fn(),
  buildSessionDir: vi.fn().mockReturnValue('/output/example.com_2026-01-01'),
  recordDomainAttempt: vi.fn(),
  recordDomainBlock: vi.fn(),
}));

describe('runCrawler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.read.mockResolvedValue({
      storage: {
        logsDir: '/logs',
        outputDir: '/output',
      },
      browser: {
        headless: false,
        slowMoMs: 0,
        antiBot: {
          enabled: true,
          stealth: true,
          rotateFingerprint: true,
          fingerprints: [],
          humanizedDelay: {
            enabled: false,
            minMs: 0,
            maxMs: 0,
          },
          challengeDetection: {
            enabled: true,
            patterns: ['cloudflare'],
          },
          blockMetrics: {
            enabled: true,
            fileName: 'block-metrics.json',
          },
        },
      },
      network: {},
      locale: {},
      logging: {},
      terminal: {},
      integrations: {},
      retry: {
        maxAttempts: 1,
        backoffMs: 0,
      },
    });
    (captureScreenshot as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('/out/screenshot-desktop.png')
      .mockResolvedValueOnce('/out/screenshot-mobile.png');
    (saveHtml as ReturnType<typeof vi.fn>).mockResolvedValue('/out/page.html');
    mockClose.mockResolvedValue(undefined);
  });

  async function runDefaultCrawler() {
    return runCrawler('https://example.com', mockConfigService);
  }

  it('retorna CrawlerResult com url, outputDir, paths e manifesto', async () => {
    const result = await runDefaultCrawler();
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
    await runDefaultCrawler();
    expect(extractContacts).toHaveBeenCalledOnce();
    expect(extractContacts).toHaveBeenCalledWith({
      html: '<html></html>',
      baseUrl: 'https://example.com/',
    });
  });

  it('chama extractBranding com a página ativa', async () => {
    await runDefaultCrawler();
    expect(extractBranding).toHaveBeenCalledOnce();
    expect(extractBranding).toHaveBeenCalledWith(mockPage);
  });

  it('chama createBrowserSession', async () => {
    await runDefaultCrawler();
    expect(createBrowserSession).toHaveBeenCalledOnce();
  });

  it('chama loadPage com a URL validada', async () => {
    await runDefaultCrawler();
    expect(loadPage).toHaveBeenCalledWith(mockPage, 'https://example.com/', expect.any(Function));
  });

  it('chama extractMetadata com o HTML renderizado', async () => {
    await runDefaultCrawler();
    expect(extractMetadata).toHaveBeenCalledOnce();
    expect(extractMetadata).toHaveBeenCalledWith('<html></html>');
  });

  it('chama buildSiteManifest com os dados consolidados', async () => {
    await runDefaultCrawler();

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
    await runDefaultCrawler();
    expect(saveSiteManifest).toHaveBeenCalledOnce();
    expect(saveSiteManifest).toHaveBeenCalledWith(mockSiteManifest, '/output/example.com_2026-01-01');
  });

  it('chama captureScreenshot duas vezes (desktop e mobile)', async () => {
    await runDefaultCrawler();
    expect(captureScreenshot).toHaveBeenCalledTimes(2);
  });

  it('chama saveHtml uma vez', async () => {
    await runDefaultCrawler();
    expect(saveHtml).toHaveBeenCalledOnce();
    expect(saveHtml).toHaveBeenCalledWith('<html></html>', '/output/example.com_2026-01-01');
  });

  it('obtém o HTML da página apenas uma vez', async () => {
    await runDefaultCrawler();
    expect(mockPage.content).toHaveBeenCalledOnce();
  });

  it('chama session.close() ao final (finally)', async () => {
    await runDefaultCrawler();
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('chama ensureDir para logsDir e outputDir', async () => {
    await runDefaultCrawler();
    expect(ensureDir).toHaveBeenCalledTimes(2);
  });

  it('carrega configuração global via serviço injetado', async () => {
    await runDefaultCrawler();
    expect(mockConfigService.read).toHaveBeenCalledOnce();
  });

  it('registra tentativa de domínio antes da execução', async () => {
    await runDefaultCrawler();
    expect(recordDomainAttempt).toHaveBeenCalledOnce();
    expect(recordDomainAttempt).toHaveBeenCalledWith(
      '/logs',
      'example.com',
      expect.any(String),
      'block-metrics.json',
    );
  });

  it('não interrompe o crawl quando recordDomainAttempt falha', async () => {
    (recordDomainAttempt as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('falha de escrita');
    });

    const result = await runDefaultCrawler();

    expect(result).not.toBeNull();
    expect(saveSiteManifest).toHaveBeenCalledOnce();
  });

  it('retorna null e registra bloqueio quando challenge é detectado', async () => {
    (detectChallenge as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      type: 'cloudflare',
      matchedPattern: 'cloudflare',
      source: 'html',
    });

    const result = await runDefaultCrawler();

    expect(result).toBeNull();
    expect(recordDomainBlock).toHaveBeenCalledOnce();
    expect(captureScreenshot).not.toHaveBeenCalled();
    expect(saveHtml).not.toHaveBeenCalled();
  });

  it('não lança erro quando recordDomainBlock falha durante challenge', async () => {
    (detectChallenge as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      type: 'cloudflare',
      matchedPattern: 'cloudflare',
      source: 'html',
    });
    (recordDomainBlock as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('falha de escrita');
    });

    await expect(runDefaultCrawler()).resolves.toBeNull();
  });

  it('lança erro se URL for inválida', async () => {
    await expect(runCrawler('nao-e-url')).rejects.toThrow(/URL inválida/);
  });

  it('chama session.close() mesmo quando loadPage lança erro', async () => {
    (loadPage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('falha'));
    await expect(runDefaultCrawler()).rejects.toThrow('falha');
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
