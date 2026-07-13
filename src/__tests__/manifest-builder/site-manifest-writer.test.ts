import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../../logger';
import { saveSiteManifest, SITE_MANIFEST_FILE_NAME } from '../../manifest-builder';

vi.mock('fs');

describe('SiteManifestWriter', () => {
  let writeFileSyncSpy: ReturnType<typeof vi.spyOn>;
  let existsSyncSpy: ReturnType<typeof vi.spyOn>;
  let statSyncSpy: ReturnType<typeof vi.spyOn>;
  let logSaveSpy: ReturnType<typeof vi.spyOn>;
  let logSuccessSpy: ReturnType<typeof vi.spyOn>;
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  const manifest = {
    schemaVersion: '1.0.0',
    source: {
      url: 'https://example.com/',
      domain: 'example.com',
      timestamp: '2026-07-12_10-00-00',
      outputDir: '/out/example.com_2026-07-12_10-00-00',
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
    },
    branding: {
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
    },
    analysis: {
      seo: { metadata: {
        title: 'Título',
        description: 'Descrição',
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
      }, audit: {} },
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

  beforeEach(() => {
    writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    statSyncSpy = vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
    logSaveSpy = vi.spyOn(logger, 'logSave').mockImplementation(() => {});
    logSuccessSpy = vi.spyOn(logger, 'logSuccess').mockImplementation(() => {});
    logErrorSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {});
  });

  afterEach(() => {
    writeFileSyncSpy.mockRestore();
    existsSyncSpy.mockRestore();
    statSyncSpy.mockRestore();
    logSaveSpy.mockRestore();
    logSuccessSpy.mockRestore();
    logErrorSpy.mockRestore();
  });

  it('salva o manifesto em site.json no diretório informado', async () => {
    const result = await saveSiteManifest(manifest, '/out/example.com_2026-07-12_10-00-00');

    expect(writeFileSyncSpy).toHaveBeenCalledOnce();
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join('/out/example.com_2026-07-12_10-00-00', SITE_MANIFEST_FILE_NAME),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    expect(result).toBe(path.join('/out/example.com_2026-07-12_10-00-00', SITE_MANIFEST_FILE_NAME));
  });

  it('lança erro quando o diretório de saída está vazio', async () => {
    await expect(saveSiteManifest(manifest, '   ')).rejects.toThrow(
      'O diretório de saída é obrigatório para salvar o site.json.',
    );
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledOnce();
  });

  it('lança erro quando o diretório de saída não existe', async () => {
    existsSyncSpy.mockReturnValue(false);

    await expect(saveSiteManifest(manifest, '/out/inexistente')).rejects.toThrow(
      'O diretório de saída informado não existe ou não é um diretório válido.',
    );
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
    expect(logErrorSpy).toHaveBeenCalledOnce();
  });

  it('registra log de salvamento e sucesso', async () => {
    await saveSiteManifest(manifest, '/out/example.com_2026-07-12_10-00-00');

    expect(logSaveSpy).toHaveBeenCalledOnce();
    expect(logSuccessSpy).toHaveBeenCalledOnce();
  });
});