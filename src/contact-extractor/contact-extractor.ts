import { load, type CheerioAPI } from 'cheerio';
import { logError, logStart, logSuccess } from '../logger';
import type {
  AddressContact,
  BranchOffice,
  BusinessHour,
  ContactConfidence,
  ContactCta,
  ContactExtractionResult,
  ContactExtractorInput,
  ContactFormSummary,
  Coordinates,
  EmailContact,
  MapReference,
  PhoneContact,
  SocialPlatform,
  SocialProfile,
  WhatsAppContact,
} from './types';

const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const HOURS_REGEX = /(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|seg\.|ter\.|qua\.|qui\.|sex\.|sab\.|dom\.).{0,40}(\d{1,2}[:h]\d{0,2}|fechado)/i;
const CAPTCHA_REGEX = /(captcha|g-recaptcha|hcaptcha|recaptcha)/i;
const BRANCH_REGEX = /(filial|unidade|loja\s+\d|matriz)/i;
const CONTACT_SECTION_REGEX = /(contato|contact|fale conosco|endereco|endereço)/i;

const SOCIAL_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.me'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  pinterest: ['pinterest.com'],
  x: ['x.com', 'twitter.com'],
  threads: ['threads.net'],
  behance: ['behance.net'],
  github: ['github.com'],
};

const CTA_KEYWORDS = [
  'solicite orçamento',
  'fale conosco',
  'agende uma visita',
  'entre em contato',
  'peça um orçamento',
  'whatsapp',
] as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.length === 11 && digits.startsWith('0')) return `+55${digits.slice(1)}`;
  if (digits.length >= 12 && value.trim().startsWith('+')) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 11) return `+55${digits}`;
  return `+${digits}`;
}

function dedupeByKey<T>(items: T[], keyFactory: (item: T) => string): T[] {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  items.forEach((item) => {
    const key = keyFactory(item);
    if (seen.has(key)) return;
    seen.add(key);
    uniqueItems.push(item);
  });

  return uniqueItems;
}

function tryResolveUrl(url: string, baseUrl?: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url.trim();
  }
}

function detectSocialPlatform(url: URL): SocialPlatform | null {
  const hostname = url.hostname.toLowerCase();
  const entry = Object.entries(SOCIAL_HOSTS).find(([, hosts]) => hosts.some((host) => hostname.endsWith(host)));
  return (entry?.[0] as SocialPlatform | undefined) ?? null;
}

function extractHandle(url: URL): string | null {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const value = parts[parts.length - 1]?.replace(/^@/, '').trim();
  return value ? value : null;
}

function parseCoordinates(raw: string): Coordinates | null {
  const match = raw.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

function parseSchemaBlocks($: CheerioAPI): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === 'object') blocks.push(item as Record<string, unknown>);
        });
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        blocks.push(parsed as Record<string, unknown>);
      }
    } catch {
      return;
    }
  });

  return blocks;
}

function extractPhones($: CheerioAPI): PhoneContact[] {
  const collected: PhoneContact[] = [];

  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const phone = href.replace(/^tel:/i, '').trim();
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    collected.push({ raw: phone, normalized, source: 'href', confidence: 'high' });
  });

  const textPhones = $('body').text().match(PHONE_REGEX) ?? [];
  textPhones.forEach((raw) => {
    const normalized = normalizePhone(raw);
    if (!normalized) return;
    collected.push({ raw: normalizeWhitespace(raw), normalized, source: 'text', confidence: 'medium' });
  });

  return dedupeByKey(collected, (item) => item.normalized);
}

function extractWhatsApp($: CheerioAPI, phones: PhoneContact[], baseUrl?: string): WhatsAppContact[] {
  const collected: WhatsAppContact[] = [];

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!/(wa\.me|api\.whatsapp\.com|whatsapp\.com)/i.test(href)) return;

    const resolvedUrl = tryResolveUrl(href, baseUrl);
    const phoneMatch = resolvedUrl.match(/(\+?\d{10,15})/);
    const normalizedPhone = phoneMatch ? normalizePhone(phoneMatch[1]) : null;
    collected.push({
      url: resolvedUrl,
      phone: normalizedPhone,
      source: 'href',
      confidence: normalizedPhone ? 'high' : 'medium',
    });
  });

  phones.forEach((phone) => {
    if (!/55\d{10,11}$/.test(phone.normalized.replace(/^\+/, ''))) return;
    collected.push({
      url: `https://wa.me/${phone.normalized.replace(/\D/g, '')}`,
      phone: phone.normalized,
      source: 'text',
      confidence: 'low',
    });
  });

  return dedupeByKey(collected, (item) => `${item.url}::${item.phone ?? ''}`);
}

function extractEmails($: CheerioAPI): EmailContact[] {
  const collected: EmailContact[] = [];

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const email = href.replace(/^mailto:/i, '').split('?')[0]?.trim().toLowerCase();
    if (!email) return;
    collected.push({ email, source: 'href', confidence: 'high' });
  });

  const textEmails = $('body').text().match(EMAIL_REGEX) ?? [];
  textEmails.forEach((email) => {
    collected.push({ email: email.toLowerCase(), source: 'text', confidence: 'medium' });
  });

  return dedupeByKey(collected, (item) => item.email);
}

function extractAddressesFromSchema(schemaBlocks: Record<string, unknown>[]): AddressContact[] {
  const addresses: AddressContact[] = [];

  schemaBlocks.forEach((block) => {
    const value = block.address;
    if (!value || typeof value !== 'object') return;

    const typedAddress = value as Record<string, unknown>;
    const parts = [
      typedAddress.streetAddress,
      typedAddress.addressLocality,
      typedAddress.addressRegion,
      typedAddress.postalCode,
      typedAddress.addressCountry,
    ]
      .filter((item) => typeof item === 'string')
      .map((item) => normalizeWhitespace(item as string));

    if (parts.length === 0) return;
    addresses.push({ text: parts.join(', '), source: 'schema', confidence: 'high' });
  });

  return addresses;
}

function extractAddressesFromSections($: CheerioAPI): AddressContact[] {
  const addresses: AddressContact[] = [];

  const footerText = normalizeWhitespace($('footer').text());
  if (footerText && /\d{5}-?\d{3}/.test(footerText)) {
    addresses.push({ text: footerText, source: 'footer', confidence: 'medium' });
  }

  $('section, div, article').each((_, el) => {
    const sectionText = normalizeWhitespace($(el).text());
    if (!CONTACT_SECTION_REGEX.test(sectionText)) return;
    if (!/\d{5}-?\d{3}|rua|avenida|av\.|travessa|alameda/i.test(sectionText)) return;

    addresses.push({ text: sectionText, source: 'contact-section', confidence: 'medium' });
  });

  return addresses;
}

function extractSocialProfiles($: CheerioAPI, baseUrl?: string): SocialProfile[] {
  const profiles: SocialProfile[] = [];

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl);
      const platform = detectSocialPlatform(resolved);
      if (!platform) return;

      profiles.push({
        platform,
        url: resolved.toString(),
        handle: extractHandle(resolved),
      });
    } catch {
      return;
    }
  });

  return dedupeByKey(profiles, (item) => `${item.platform}::${item.url}`);
}

function extractMapReferences($: CheerioAPI, baseUrl?: string): MapReference[] {
  const maps: MapReference[] = [];

  const collectMap = (url: string, source: 'href' | 'iframe' | 'script'): void => {
    if (!/google\.[^/]+\/maps|maps\.google\.com|goo\.gl\/maps/i.test(url)) return;
    const resolved = tryResolveUrl(url, baseUrl);
    maps.push({ url: resolved, source, coordinates: parseCoordinates(resolved) });
  };

  $('a[href], iframe[src], script[src]').each((_, el) => {
    const href = $(el).attr('href');
    const src = $(el).attr('src');
    if (href) collectMap(href, 'href');
    if (src && el.tagName === 'iframe') collectMap(src, 'iframe');
    if (src && el.tagName === 'script') collectMap(src, 'script');
  });

  return dedupeByKey(maps, (item) => item.url);
}

function extractBusinessHours($: CheerioAPI, schemaBlocks: Record<string, unknown>[]): BusinessHour[] {
  const fromSchema: BusinessHour[] = [];

  schemaBlocks.forEach((block) => {
    const openingHours = block.openingHours;
    if (typeof openingHours === 'string') {
      fromSchema.push({ text: normalizeWhitespace(openingHours), source: 'schema' });
    }

    if (Array.isArray(openingHours)) {
      openingHours.forEach((item) => {
        if (typeof item !== 'string') return;
        fromSchema.push({ text: normalizeWhitespace(item), source: 'schema' });
      });
    }
  });

  const fromText: BusinessHour[] = [];
  $('p, span, li, div').each((_, el) => {
    const text = normalizeWhitespace($(el).text());
    if (!text || !HOURS_REGEX.test(text)) return;
    fromText.push({ text, source: 'text' });
  });

  return dedupeByKey([...fromSchema, ...fromText], (item) => `${item.source}::${item.text}`);
}

function resolveMethod(value: string | undefined): 'GET' | 'POST' | 'UNKNOWN' {
  const method = value?.trim().toUpperCase();
  if (method === 'GET' || method === 'POST') return method;
  return 'UNKNOWN';
}

function extractForms($: CheerioAPI): ContactFormSummary[] {
  const forms: ContactFormSummary[] = [];

  $('form').each((_, el) => {
    const form = $(el);
    const action = form.attr('action')?.trim() ?? null;
    const method = resolveMethod(form.attr('method'));
    const requiredFields = form.find('[required]').length;
    const hasCaptcha = CAPTCHA_REGEX.test(form.html() ?? '');
    const fieldNames = form
      .find('input[name], textarea[name], select[name]')
      .toArray()
      .map((field) => $(field).attr('name')?.trim() ?? '')
      .filter(Boolean);

    forms.push({ action, method, requiredFields, hasCaptcha, fieldNames });
  });

  return forms;
}

function extractCtas($: CheerioAPI): ContactCta[] {
  const ctas: ContactCta[] = [];

  $('a[href], button').each((_, el) => {
    const text = normalizeWhitespace($(el).text());
    if (!text) return;

    const lowerText = text.toLowerCase();
    const isMatch = CTA_KEYWORDS.some((keyword) => lowerText.includes(keyword));
    if (!isMatch) return;

    ctas.push({ text, href: $(el).attr('href')?.trim() ?? null });
  });

  return dedupeByKey(ctas, (item) => `${item.text}::${item.href ?? ''}`);
}

function extractBranches($: CheerioAPI, addresses: AddressContact[], phones: PhoneContact[], emails: EmailContact[]): BranchOffice[] {
  const branches: BranchOffice[] = [];

  const hasManyAddresses = addresses.length > 1;
  if (hasManyAddresses) {
    addresses.forEach((address, index) => {
      branches.push({
        name: index === 0 ? 'Matriz' : `Unidade ${index + 1}`,
        address: address.text,
        phones: phones.map((item) => item.normalized),
        emails: emails.map((item) => item.email),
      });
    });
  }

  $('section, article, div').each((_, el) => {
    const text = normalizeWhitespace($(el).text());
    if (!text || !BRANCH_REGEX.test(text)) return;

    branches.push({
      name: text.split(':')[0]?.slice(0, 60) ?? null,
      address: addresses[0]?.text ?? null,
      phones: phones.map((item) => item.normalized),
      emails: emails.map((item) => item.email),
    });
  });

  return dedupeByKey(branches, (item) => `${item.name ?? ''}::${item.address ?? ''}`);
}

function collectAddressFromMaps(maps: MapReference[]): AddressContact[] {
  return maps.map((map) => ({
    text: map.url,
    source: 'map',
    confidence: 'low',
  }));
}

function normalizeConfidence<T extends { confidence: ContactConfidence }>(items: T[]): T[] {
  return items.map((item) => {
    if (item.confidence === 'high' || item.confidence === 'medium') return item;
    return item;
  });
}

function buildExtractionResult($: CheerioAPI, input: ContactExtractorInput): ContactExtractionResult {
  const schemaBlocks = parseSchemaBlocks($);
  const phones = normalizeConfidence(extractPhones($));
  const whatsapp = normalizeConfidence(extractWhatsApp($, phones, input.baseUrl));
  const emails = normalizeConfidence(extractEmails($));
  const addresses = dedupeByKey(
    [...extractAddressesFromSchema(schemaBlocks), ...extractAddressesFromSections($)],
    (item) => item.text,
  );
  const maps = extractMapReferences($, input.baseUrl);
  const addressesFromMaps = collectAddressFromMaps(maps);

  return {
    phones,
    whatsapp,
    emails,
    addresses: dedupeByKey([...addresses, ...addressesFromMaps], (item) => item.text),
    socialProfiles: extractSocialProfiles($, input.baseUrl),
    maps,
    businessHours: extractBusinessHours($, schemaBlocks),
    forms: extractForms($),
    ctas: extractCtas($),
    branches: extractBranches($, addresses, phones, emails),
  };
}

export class ContactExtractorService {
  extract(input: ContactExtractorInput): ContactExtractionResult {
    logStart('Extraindo contatos da página renderizada');

    try {
      const $ = load(input.html);
      const result = buildExtractionResult($, input);
      logSuccess('Contatos extraídos com sucesso');
      return result;
    } catch (error) {
      logError('Falha ao extrair contatos da página', error);
      throw error instanceof Error ? error : new Error('Falha ao extrair contatos da página');
    }
  }
}

export function extractContacts(
  input: ContactExtractorInput,
  service: ContactExtractorService = new ContactExtractorService(),
): ContactExtractionResult {
  return service.extract(input);
}
