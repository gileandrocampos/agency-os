import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { logStart, logSuccess, logError } from '../logger';
import type { SiteMetadata, OpenGraphMetadata, TwitterCardMetadata } from './types';

function extractMetaByName($: CheerioAPI, name: string): string | null {
  return $(`meta[name="${name}"]`).attr('content')?.trim() ?? null;
}

function extractMetaByProperty($: CheerioAPI, property: string): string | null {
  return $(`meta[property="${property}"]`).attr('content')?.trim() ?? null;
}

function extractTitle($: CheerioAPI): string | null {
  const text = $('head title').first().text().trim();
  return text || null;
}

function extractCharset($: CheerioAPI): string | null {
  const charset =
    $('meta[charset]').attr('charset')?.trim() ??
    $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^\s;]+)/i)?.[1]?.trim();
  return charset ?? null;
}

function extractCanonical($: CheerioAPI): string | null {
  return $('head link[rel="canonical"]').attr('href')?.trim() ?? null;
}

function extractOpenGraph($: CheerioAPI): OpenGraphMetadata {
  return {
    title: extractMetaByProperty($, 'og:title'),
    description: extractMetaByProperty($, 'og:description'),
    image: extractMetaByProperty($, 'og:image'),
    url: extractMetaByProperty($, 'og:url'),
    type: extractMetaByProperty($, 'og:type'),
    siteName: extractMetaByProperty($, 'og:site_name'),
  };
}

function extractTwitterCard($: CheerioAPI): TwitterCardMetadata {
  return {
    card: extractMetaByName($, 'twitter:card'),
    title: extractMetaByName($, 'twitter:title'),
    description: extractMetaByName($, 'twitter:description'),
    image: extractMetaByName($, 'twitter:image'),
  };
}

export function extractMetadata(html: string): SiteMetadata {
  logStart('Extraindo metadados do <head>...');

  try {
    const $ = load(html);

    const result: SiteMetadata = {
      title: extractTitle($),
      description: extractMetaByName($, 'description'),
      keywords: extractMetaByName($, 'keywords'),
      author: extractMetaByName($, 'author'),
      viewport: extractMetaByName($, 'viewport'),
      charset: extractCharset($),
      robots: extractMetaByName($, 'robots'),
      canonical: extractCanonical($),
      openGraph: extractOpenGraph($),
      twitterCard: extractTwitterCard($),
    };

    logSuccess('Metadados extraídos com sucesso');
    return result;
  } catch (error) {
    logError('Falha ao extrair metadados do <head>', error);
    throw error;
  }
}
