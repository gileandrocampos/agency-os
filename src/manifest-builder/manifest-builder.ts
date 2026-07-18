import { logError, logStart, logSuccess } from '../logger';
import type { ContactExtractionResult } from '../contact-extractor';
import type { Heading } from '../parser';
import type {
  EmptySection,
  ManifestAnalysis,
  ManifestBuilderInput,
  ManifestContent,
  ManifestGenerators,
  ManifestIntegrations,
  ManifestPlatform,
  ManifestSeoAnalysis,
  ManifestSource,
  SiteManifest,
} from './types';

export const MANIFEST_SCHEMA_VERSION = '1.0.0';

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function ensureString(value: string, fieldName: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`O campo ${fieldName} é obrigatório para montar o site.json.`);
  }

  return normalized;
}

function ensureObject(value: unknown, fieldName: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`O campo ${fieldName} deve ser um objeto válido.`);
  }
}

function ensureArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`O campo ${fieldName} deve ser um array válido.`);
  }
}

function ensureUrl(value: string): string {
  const normalized = ensureString(value, 'URL');

  try {
    return new URL(normalized).toString();
  } catch {
    throw new Error(`A URL ${normalized} é inválida para o site.json.`);
  }
}

function resolveText(fieldName: string, primary: string | null, fallback: string | null): string | null {
  const normalizedPrimary = normalizeText(primary);
  const normalizedFallback = normalizeText(fallback);

  if (normalizedPrimary && normalizedFallback && normalizedPrimary !== normalizedFallback) {
    throw new Error(`Dados inconsistentes para ${fieldName}: "${normalizedPrimary}" e "${normalizedFallback}".`);
  }

  return normalizedPrimary ?? normalizedFallback;
}

function dedupeByKey<T>(items: T[], keyFactory: (item: T) => string): T[] {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  items.forEach((item) => {
    const key = keyFactory(item);

    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  });

  return uniqueItems;
}

function normalizeHeading(heading: Heading): Heading {
  return {
    level: heading.level,
    text: heading.text.trim(),
  };
}

function normalizeLink(link: { href: string; text: string }): { href: string; text: string } {
  return {
    href: link.href.trim(),
    text: link.text.trim(),
  };
}

function normalizeImage(image: { src: string; alt: string }): { src: string; alt: string } {
  return {
    src: image.src.trim(),
    alt: image.alt.trim(),
  };
}

function normalizeNavigationLinks(links: { href: string; text: string }[]): { href: string; text: string }[] {
  return dedupeByKey(links.map(normalizeLink), (link) => `${link.href}::${link.text}`);
}

function normalizeContactCollection<T>(items: T[], keyFactory: (item: T) => string): T[] {
  return dedupeByKey(items, keyFactory);
}

function normalizeContacts(contacts: ContactExtractionResult): ContactExtractionResult {
  return {
    phones: normalizeContactCollection(contacts.phones, (item) => item.normalized),
    whatsapp: normalizeContactCollection(contacts.whatsapp, (item) => `${item.url}::${item.phone ?? ''}`),
    emails: normalizeContactCollection(contacts.emails, (item) => item.email),
    addresses: normalizeContactCollection(contacts.addresses, (item) => item.text),
    socialProfiles: normalizeContactCollection(contacts.socialProfiles, (item) => `${item.platform}::${item.url}`),
    maps: normalizeContactCollection(contacts.maps, (item) => item.url),
    businessHours: normalizeContactCollection(contacts.businessHours, (item) => item.text),
    forms: normalizeContactCollection(contacts.forms, (item) => `${item.method}::${item.action ?? ''}::${item.fieldNames.join('|')}`),
    ctas: normalizeContactCollection(contacts.ctas, (item) => `${item.text}::${item.href ?? ''}`),
    branches: normalizeContactCollection(contacts.branches, (item) => `${item.name ?? ''}::${item.address ?? ''}`),
  };
}

function normalizeContent(input: ManifestBuilderInput): ManifestContent {
  return {
    language: normalizeText(input.parsedSite.language),
    headings: dedupeByKey(input.parsedSite.headings.map(normalizeHeading), (heading) => `${heading.level}::${heading.text}`),
    paragraphs: dedupeByKey(input.parsedSite.paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean), (paragraph) => paragraph),
    links: dedupeByKey(input.parsedSite.links.map(normalizeLink), (link) => `${link.href}::${link.text}`),
    navigation: {
      mainMenu: normalizeNavigationLinks(input.parsedSite.navigation.mainMenu),
      footerMenu: normalizeNavigationLinks(input.parsedSite.navigation.footerMenu),
      internalLinks: normalizeNavigationLinks(input.parsedSite.navigation.internalLinks),
      externalLinks: normalizeNavigationLinks(input.parsedSite.navigation.externalLinks),
    },
    images: dedupeByKey(input.parsedSite.images.map(normalizeImage), (image) => `${image.src}::${image.alt}`),
    contact: normalizeContacts(input.contacts),
  };
}

function createEmptySection(): EmptySection {
  return {};
}

function normalizeMetadata(input: ManifestBuilderInput): ManifestSeoAnalysis {
  return {
    metadata: {
      title: resolveText('título', input.metadata.title, input.parsedSite.title),
      description: resolveText('descrição', input.metadata.description, input.parsedSite.description),
      keywords: normalizeText(input.metadata.keywords),
      author: normalizeText(input.metadata.author),
      viewport: normalizeText(input.metadata.viewport),
      charset: normalizeText(input.metadata.charset),
      robots: normalizeText(input.metadata.robots),
      canonical: normalizeText(input.metadata.canonical),
      openGraph: {
        title: normalizeText(input.metadata.openGraph.title),
        description: normalizeText(input.metadata.openGraph.description),
        image: normalizeText(input.metadata.openGraph.image),
        url: normalizeText(input.metadata.openGraph.url),
        type: normalizeText(input.metadata.openGraph.type),
        siteName: normalizeText(input.metadata.openGraph.siteName),
      },
      twitterCard: {
        card: normalizeText(input.metadata.twitterCard.card),
        title: normalizeText(input.metadata.twitterCard.title),
        description: normalizeText(input.metadata.twitterCard.description),
        image: normalizeText(input.metadata.twitterCard.image),
      },
    },
    audit: createEmptySection(),
  };
}

function buildSource(input: ManifestBuilderInput): ManifestSource {
  return {
    url: ensureUrl(input.url),
    domain: ensureString(input.domain, 'domínio'),
    timestamp: ensureString(input.timestamp, 'timestamp'),
    outputDir: ensureString(input.outputDir, 'diretório de saída'),
    artifacts: {
      htmlFile: ensureString(input.htmlFile, 'arquivo HTML'),
      screenshots: {
        desktop: ensureString(input.screenshotDesktop, 'screenshot desktop'),
        mobile: ensureString(input.screenshotMobile, 'screenshot mobile'),
      },
    },
  };
}

function validateInput(input: ManifestBuilderInput): void {
  ensureObject(input.parsedSite, 'parsedSite');
  ensureObject(input.metadata, 'metadata');
  ensureObject(input.branding, 'branding');
  ensureObject(input.contacts, 'contacts');
  ensureObject(input.parsedSite.navigation, 'parsedSite.navigation');
  ensureObject(input.metadata.openGraph, 'metadata.openGraph');
  ensureObject(input.metadata.twitterCard, 'metadata.twitterCard');

  ensureArray(input.parsedSite.headings, 'parsedSite.headings');
  ensureArray(input.parsedSite.paragraphs, 'parsedSite.paragraphs');
  ensureArray(input.parsedSite.links, 'parsedSite.links');
  ensureArray(input.parsedSite.navigation.mainMenu, 'parsedSite.navigation.mainMenu');
  ensureArray(input.parsedSite.navigation.footerMenu, 'parsedSite.navigation.footerMenu');
  ensureArray(input.parsedSite.navigation.internalLinks, 'parsedSite.navigation.internalLinks');
  ensureArray(input.parsedSite.navigation.externalLinks, 'parsedSite.navigation.externalLinks');
  ensureArray(input.parsedSite.images, 'parsedSite.images');
  ensureArray(input.contacts.phones, 'contacts.phones');
  ensureArray(input.contacts.whatsapp, 'contacts.whatsapp');
  ensureArray(input.contacts.emails, 'contacts.emails');
  ensureArray(input.contacts.addresses, 'contacts.addresses');
  ensureArray(input.contacts.socialProfiles, 'contacts.socialProfiles');
  ensureArray(input.contacts.maps, 'contacts.maps');
  ensureArray(input.contacts.businessHours, 'contacts.businessHours');
  ensureArray(input.contacts.forms, 'contacts.forms');
  ensureArray(input.contacts.ctas, 'contacts.ctas');
  ensureArray(input.contacts.branches, 'contacts.branches');
}

function buildAnalysis(input: ManifestBuilderInput): ManifestAnalysis {
  return {
    seo: normalizeMetadata(input),
    ux: { audit: createEmptySection() },
    performance: { audit: createEmptySection() },
  };
}

function buildGenerators(): ManifestGenerators {
  return {
    designSystem: createEmptySection(),
    wireframes: createEmptySection(),
  };
}

function buildIntegrations(): ManifestIntegrations {
  return {
    ai: createEmptySection(),
    googleMaps: createEmptySection(),
  };
}

function buildPlatform(): ManifestPlatform {
  return {
    saas: createEmptySection(),
  };
}

function createManifest(input: ManifestBuilderInput): SiteManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    source: buildSource(input),
    content: normalizeContent(input),
    branding: input.branding,
    analysis: buildAnalysis(input),
    generators: buildGenerators(),
    integrations: buildIntegrations(),
    platform: buildPlatform(),
  };
}

export class ManifestBuilder {
  build(input: ManifestBuilderInput): SiteManifest {
    logStart('Montando site.json');

    try {
      validateInput(input);
      const manifest = createManifest(input);
      logSuccess('site.json consolidado com sucesso');
      return manifest;
    } catch (error) {
      logError('Falha ao montar o site.json', error);
      throw error instanceof Error ? error : new Error('Falha ao montar o site.json');
    }
  }
}

export function buildSiteManifest(input: ManifestBuilderInput): SiteManifest {
  return new ManifestBuilder().build(input);
}