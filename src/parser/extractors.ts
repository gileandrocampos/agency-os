import type { CheerioAPI } from 'cheerio';
import type { Heading, Link, Image } from './types';

export function extractTitle($: CheerioAPI): string | null {
  const text = $('title').first().text().trim();
  return text || null;
}

export function extractDescription($: CheerioAPI): string | null {
  const content = $('meta[name="description"]').attr('content')?.trim();
  return content ?? null;
}

export function extractLanguage($: CheerioAPI): string | null {
  const lang = $('html').attr('lang')?.trim();
  return lang ?? null;
}

export function extractHeadings($: CheerioAPI): Heading[] {
  const headings: Heading[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = el.tagName as Heading['level'];
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });

  return headings;
}

export function extractParagraphs($: CheerioAPI): string[] {
  const paragraphs: string[] = [];

  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });

  return paragraphs;
}

export function extractLinks($: CheerioAPI): Link[] {
  const links: Link[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim() ?? '';
    const text = $(el).text().trim();
    links.push({ href, text });
  });

  return links;
}

export function extractImages($: CheerioAPI): Image[] {
  const images: Image[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src')?.trim() ?? '';
    const alt = $(el).attr('alt')?.trim() ?? '';
    images.push({ src, alt });
  });

  return images;
}
