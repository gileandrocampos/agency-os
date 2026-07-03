import { load } from 'cheerio';
import { logStart, logSuccess, logError } from '../logger';
import type { ParsedSite } from './types';
import {
  extractTitle,
  extractDescription,
  extractLanguage,
  extractHeadings,
  extractParagraphs,
  extractLinks,
  extractImages,
} from './extractors';
import { extractNavigation } from './navigation-extractor';

export function parseSite(html: string, baseUrl?: string): ParsedSite {
  logStart('Iniciando parsing do HTML...');

  try {
    const $ = load(html);

    const result: ParsedSite = {
      title: extractTitle($),
      description: extractDescription($),
      language: extractLanguage($),
      headings: extractHeadings($),
      paragraphs: extractParagraphs($),
      links: extractLinks($),
      navigation: extractNavigation($, baseUrl),
      images: extractImages($),
    };

    logSuccess('Parsing concluído com sucesso');
    return result;
  } catch (error) {
    logError('Falha ao realizar parsing do HTML', error);
    throw error;
  }
}
