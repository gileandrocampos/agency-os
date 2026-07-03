import type { CheerioAPI } from 'cheerio';
import type { Link, NavigationData } from '../types';

const MAIN_MENU_SELECTORS = ['header nav a[href]', 'nav a[href]', '[role="navigation"] a[href]'] as const;
const FOOTER_SELECTORS = ['footer a[href]', '[role="contentinfo"] a[href]'] as const;
const IGNORED_PREFIXES = ['#', 'javascript:', 'mailto:', 'tel:'] as const;

function createLink(href: string, text: string): Link | null {
  const normalizedHref = href.trim();
  const normalizedText = text.trim();

  if (!normalizedHref) {
    return null;
  }

  return {
    href: normalizedHref,
    text: normalizedText,
  };
}

function dedupeLinks(links: Link[]): Link[] {
  const seen = new Set<string>();
  const uniqueLinks: Link[] = [];

  links.forEach((link) => {
    const key = `${link.href}::${link.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLinks.push(link);
    }
  });

  return uniqueLinks;
}

function collectLinksBySelector($: CheerioAPI, selector: string): Link[] {
  const links: Link[] = [];

  $(selector).each((_, element) => {
    const href = $(element).attr('href') ?? '';
    const text = $(element).text();
    const link = createLink(href, text);

    if (link) {
      links.push(link);
    }
  });

  return links;
}

function parseBaseHostname(baseUrl?: string): string | null {
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(baseUrl).hostname;
  } catch {
    return null;
  }
}

function isIgnoredLink(href: string): boolean {
  const lowerHref = href.toLowerCase();
  return IGNORED_PREFIXES.some((prefix) => lowerHref.startsWith(prefix));
}

function getResolvedUrl(href: string, baseUrl?: string): URL | null {
  try {
    return baseUrl ? new URL(href, baseUrl) : new URL(href);
  } catch {
    return null;
  }
}

function isLikelyRelative(href: string): boolean {
  return href.startsWith('/') || href.startsWith('./') || href.startsWith('../');
}

function classifyLink(link: Link, baseHostname: string | null, baseUrl?: string): 'internal' | 'external' | 'ignore' {
  if (isIgnoredLink(link.href)) {
    return 'ignore';
  }

  const resolvedUrl = getResolvedUrl(link.href, baseUrl);
  if (!resolvedUrl) {
    return isLikelyRelative(link.href) ? 'internal' : 'ignore';
  }

  if (resolvedUrl.protocol !== 'http:' && resolvedUrl.protocol !== 'https:') {
    return 'ignore';
  }

  if (!baseHostname) {
    return /^https?:\/\//i.test(link.href) ? 'external' : 'internal';
  }

  return resolvedUrl.hostname === baseHostname ? 'internal' : 'external';
}

function splitLinksByScope(
  links: Link[],
  baseHostname: string | null,
  baseUrl?: string,
): Pick<NavigationData, 'internalLinks' | 'externalLinks'> {
  const internalLinks: Link[] = [];
  const externalLinks: Link[] = [];

  links.forEach((link) => {
    const classification = classifyLink(link, baseHostname, baseUrl);

    if (classification === 'internal') {
      internalLinks.push(link);
    }

    if (classification === 'external') {
      externalLinks.push(link);
    }
  });

  return { internalLinks, externalLinks };
}

function collectFromManySelectors($: CheerioAPI, selectors: readonly string[]): Link[] {
  const aggregated: Link[] = [];

  selectors.forEach((selector) => {
    aggregated.push(...collectLinksBySelector($, selector));
  });

  return dedupeLinks(aggregated);
}

export function extractNavigation($: CheerioAPI, baseUrl?: string): NavigationData {
  const mainMenu = collectFromManySelectors($, MAIN_MENU_SELECTORS);
  const footerMenu = collectFromManySelectors($, FOOTER_SELECTORS);
  const allLinks = dedupeLinks(collectLinksBySelector($, 'a[href]'));
  const baseHostname = parseBaseHostname(baseUrl);
  const scopedLinks = splitLinksByScope(allLinks, baseHostname, baseUrl);

  return {
    mainMenu,
    footerMenu,
    internalLinks: scopedLinks.internalLinks,
    externalLinks: scopedLinks.externalLinks,
  };
}