import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as logger from '../../logger';
import { buildSiteManifest, ManifestBuilder } from '../../manifest-builder';
import type { ManifestBuilderInput } from '../../manifest-builder';

describe('ManifestBuilder', () => {
  let logStartSpy: ReturnType<typeof vi.spyOn>;
  let logSuccessSpy: ReturnType<typeof vi.spyOn>;
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  const baseInput: ManifestBuilderInput = {
    url: 'https://example.com/',
    domain: 'example.com',
    timestamp: '2026-07-12_10-00-00',
    outputDir: '/output/example.com_2026-07-12_10-00-00',
    htmlFile: '/output/example.com_2026-07-12_10-00-00/page.html',
    screenshotDesktop: '/output/example.com_2026-07-12_10-00-00/screenshot-desktop.png',
    screenshotMobile: '/output/example.com_2026-07-12_10-00-00/screenshot-mobile.png',
    parsedSite: {
      title: 'Título do site',
      description: 'Descrição do site',
      language: 'pt-BR',
      headings: [
        { level: 'h1', text: 'Título do site' },
        { level: 'h2', text: 'Seção' },
        { level: 'h2', text: 'Seção' },
      ],
      paragraphs: ['Primeiro parágrafo.', 'Primeiro parágrafo.', 'Segundo parágrafo.'],
      links: [
        { href: '/', text: 'Home' },
        { href: '/', text: 'Home' },
        { href: '/contato', text: 'Contato' },
      ],
      navigation: {
        mainMenu: [
          { href: '/', text: 'Home' },
          { href: '/', text: 'Home' },
        ],
        footerMenu: [{ href: '/contato', text: 'Contato' }],
        internalLinks: [{ href: '/sobre', text: 'Sobre' }],
        externalLinks: [{ href: 'https://outside.example', text: 'Externo' }],
      },
      images: [
        { src: '/logo.png', alt: 'Logo' },
        { src: '/logo.png', alt: 'Logo' },
      ],
    },
    metadata: {
      title: 'Título do site',
      description: 'Descrição do site',
      keywords: 'typescript, crawler',
      author: 'Agency OS',
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8',
      robots: 'index, follow',
      canonical: 'https://example.com/',
      openGraph: {
        title: 'Título OG',
        description: 'Descrição OG',
        image: 'https://example.com/og.png',
        url: 'https://example.com/',
        type: 'website',
        siteName: 'Example',
      },
      twitterCard: {
        card: 'summary_large_image',
        title: 'Título Twitter',
        description: 'Descrição Twitter',
        image: 'https://example.com/twitter.png',
      },
    },
  };

  beforeEach(() => {
    logStartSpy = vi.spyOn(logger, 'logStart').mockImplementation(() => {});
    logSuccessSpy = vi.spyOn(logger, 'logSuccess').mockImplementation(() => {});
    logErrorSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {});
  });

  afterEach(() => {
    logStartSpy.mockRestore();
    logSuccessSpy.mockRestore();
    logErrorSpy.mockRestore();
  });

  it('consolida os dados em uma estrutura estável e deduplicada', () => {
    const builder = new ManifestBuilder();
    const manifest = builder.build(baseInput);

    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.source.artifacts.screenshots).toEqual({
      desktop: '/output/example.com_2026-07-12_10-00-00/screenshot-desktop.png',
      mobile: '/output/example.com_2026-07-12_10-00-00/screenshot-mobile.png',
    });
    expect(manifest.content.headings).toEqual([
      { level: 'h1', text: 'Título do site' },
      { level: 'h2', text: 'Seção' },
    ]);
    expect(manifest.content.paragraphs).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.']);
    expect(manifest.content.links).toEqual([
      { href: '/', text: 'Home' },
      { href: '/contato', text: 'Contato' },
    ]);
    expect(manifest.content.navigation.mainMenu).toEqual([{ href: '/', text: 'Home' }]);
    expect(manifest.content.images).toEqual([{ src: '/logo.png', alt: 'Logo' }]);
    expect(manifest.analysis.seo.metadata.title).toBe('Título do site');
    expect(manifest.analysis.seo.audit).toEqual({});
    expect(manifest.analysis.ux.audit).toEqual({});
    expect(manifest.analysis.performance.audit).toEqual({});
    expect(manifest.generators.designSystem).toEqual({});
    expect(manifest.integrations.googleMaps).toEqual({});
    expect(manifest.platform.saas).toEqual({});
  });

  it('usa os metadados do extractor como fonte principal e mantém fallback do parser', () => {
    const manifest = buildSiteManifest({
      ...baseInput,
      metadata: {
        ...baseInput.metadata,
        title: null,
        description: null,
      },
    });

    expect(manifest.analysis.seo.metadata.title).toBe('Título do site');
    expect(manifest.analysis.seo.metadata.description).toBe('Descrição do site');
  });

  it('lança erro quando títulos conflitantes são encontrados', () => {
    const input = {
      ...baseInput,
      metadata: {
        ...baseInput.metadata,
        title: 'Título diferente',
      },
    };

    expect(() => buildSiteManifest(input)).toThrow(/Dados inconsistentes para título/);
    expect(logErrorSpy).toHaveBeenCalledOnce();
  });

  it('registra início e sucesso ao consolidar o manifesto', () => {
    buildSiteManifest(baseInput);
    expect(logStartSpy).toHaveBeenCalledOnce();
    expect(logSuccessSpy).toHaveBeenCalledOnce();
  });
});