/// <reference lib="dom" />
import { Page } from 'playwright';
import { logStart, logSuccess, logError } from '../logger';
import type {
  BrandingExtractionResult,
  BrandingTheme,
  BorderRadiusProfile,
  ButtonInsights,
  ColorUsage,
  ComponentCount,
  CssFrameworkDetection,
  FontOrigin,
  FontUsage,
  IconLibraryDetection,
  IconLibraryName,
  LogoCandidate,
  LogoDetectionStrategy,
  SpacingProfile,
} from './types';

interface RawLogoCandidate {
  url: string | null;
  selector: string;
  strategy: Exclude<LogoDetectionStrategy, 'favicon-fallback'>;
  width: number;
  height: number;
}

interface RawStyleSample {
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  margin: string;
  padding: string;
  gap: string;
  fontFamily: string;
  fontWeight: string;
  interactive: boolean;
  surface: boolean;
}

interface RawButtonSample {
  classes: string[];
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
}

interface RawFontFace {
  family: string;
  weight: string;
  source: string | null;
}

interface RawResourceSnapshot {
  stylesheetUrls: string[];
  scriptUrls: string[];
  resourceUrls: string[];
  classNames: string[];
  fontFaces: RawFontFace[];
  svgCount: number;
}

const TRANSPARENT = 'transparent';
const MAX_SAMPLE_ELEMENTS = 1500;

export class BrandingExtractorService {
  async extract(page: Page): Promise<BrandingExtractionResult> {
    logStart('Iniciando extração de branding');

    try {
      const [logos, favicon, styleSamples, resources, components, buttons] = await Promise.all([
        this.collectLogoCandidates(page),
        this.collectFavicon(page),
        this.collectStyleSamples(page),
        this.collectResources(page),
        this.collectComponents(page),
        this.collectButtons(page),
      ]);

      const palette = this.buildPalette(styleSamples, buttons);
      const fonts = this.buildFonts(styleSamples, resources);
      const iconLibrary = this.detectIconLibrary(resources);
      const cssFramework = this.detectCssFramework(resources);
      const theme = this.detectTheme(palette);

      const result: BrandingExtractionResult = {
        logo: this.pickMainLogo(logos, favicon),
        logoCandidates: this.toLogoCandidates(logos),
        favicon,
        palette,
        fonts,
        iconLibrary,
        cssFramework,
        theme,
        borderRadius: this.buildBorderRadius(styleSamples, buttons),
        spacing: this.buildSpacing(styleSamples),
        components,
        buttons: this.buildButtonInsights(buttons),
      };

      logSuccess('Extração de branding concluída com sucesso');
      return result;
    } catch (error) {
      logError('Falha ao extrair branding', error);
      throw error instanceof Error ? error : new Error('Falha ao extrair branding');
    }
  }

  private async collectLogoCandidates(page: Page): Promise<RawLogoCandidate[]> {
    return page.evaluate(function (): RawLogoCandidate[] {
      const candidates: RawLogoCandidate[] = [];

      const helper = {
        normalizeUrl(value: string | null): string | null {
          if (!value) return null;
          const normalized = value.trim();
          return normalized.length ? normalized : null;
        },
        pushCandidate(element: Element, strategy: RawLogoCandidate['strategy'], selector: string): void {
          const rect = element.getBoundingClientRect();
          const url = element instanceof HTMLImageElement
            ? this.normalizeUrl(element.currentSrc || element.src || null)
            : this.normalizeUrl(element instanceof SVGElement ? null : null);

          candidates.push({
            url,
            selector,
            strategy,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        },
      };

      const headerImages = Array.from(document.querySelectorAll('header img, nav img'));
      headerImages.forEach((element) => helper.pushCandidate(element, 'header-image', 'header img, nav img'));

      const logoContainers = Array.from(
        document.querySelectorAll('[class*="logo" i], [id*="logo" i], [aria-label*="logo" i] img'),
      );

      logoContainers.forEach((element) => {
        if (element instanceof HTMLImageElement || element instanceof SVGElement) {
          helper.pushCandidate(element, 'class-logo', '[class*="logo" i], [id*="logo" i]');
        }
      });

      const svgLogos = Array.from(
        document.querySelectorAll('header svg, nav svg, [class*="logo" i] svg, svg[aria-label*="logo" i]'),
      );

      svgLogos.forEach((element) => helper.pushCandidate(element, 'svg-logo', 'svg logo candidates'));
      return candidates;
    });
  }

  private async collectFavicon(page: Page): Promise<string | null> {
    return page.evaluate(function (): string | null {
      const iconLink = document.querySelector<HTMLLinkElement>(
        'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
      );

      if (iconLink?.href) return iconLink.href;
      if (window.location?.origin) return `${window.location.origin}/favicon.ico`;
      return null;
    });
  }

  private async collectStyleSamples(page: Page): Promise<RawStyleSample[]> {
    return page.evaluate(function ({ maxSampleElements }): RawStyleSample[] {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('*')).slice(0, maxSampleElements);

      return elements.map((element) => {
        const styles = window.getComputedStyle(element);

        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderRadius: styles.borderRadius,
          margin: styles.margin,
          padding: styles.padding,
          gap: styles.gap,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          interactive: element.matches('a, button, [role="button"], input[type="submit"], input[type="button"]'),
          surface: element.matches('section, article, main, nav, aside, [class*="card" i], [class*="modal" i]'),
        };
      });
    }, { maxSampleElements: MAX_SAMPLE_ELEMENTS });
  }

  private async collectResources(page: Page): Promise<RawResourceSnapshot> {
    return page.evaluate(function (): RawResourceSnapshot {
      const helper = {
        collectFontFaces(): RawFontFace[] {
          const faces: RawFontFace[] = [];

          for (const styleSheet of Array.from(document.styleSheets)) {
            try {
              const rules = Array.from(styleSheet.cssRules ?? []);
              rules.forEach((rule) => {
                if (!(rule instanceof CSSFontFaceRule)) return;

                faces.push({
                  family: rule.style.getPropertyValue('font-family') ?? '',
                  weight: rule.style.getPropertyValue('font-weight') ?? '400',
                  source: rule.style.getPropertyValue('src') ?? null,
                });
              });
            } catch {
              continue;
            }
          }

          return faces;
        },
        collectPerformanceResources(): string[] {
          const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          return entries.map((entry) => entry.name).filter(Boolean);
        },
      };

      const stylesheetUrls = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
        .map((link) => link.href)
        .filter(Boolean);

      const scriptUrls = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
        .map((script) => script.src)
        .filter(Boolean);

      const classNames = Array.from(document.querySelectorAll<HTMLElement>('[class]'))
        .flatMap((element) => Array.from(element.classList));

      const fontFaces = helper.collectFontFaces();
      const resourceUrls = helper.collectPerformanceResources();
      const svgCount = document.querySelectorAll('svg').length;

      return { stylesheetUrls, scriptUrls, resourceUrls, classNames, fontFaces, svgCount };
    });
  }

  private async collectComponents(page: Page): Promise<ComponentCount[]> {
    return page.evaluate(function (): ComponentCount[] {
      const registry = [
        { name: 'navbar', selectors: 'header nav, nav.navbar, .navbar' },
        { name: 'hero', selectors: 'section.hero, .hero, [class*="hero" i]' },
        { name: 'cards', selectors: '.card, [class*="card" i], article' },
        { name: 'forms', selectors: 'form' },
        { name: 'faq', selectors: '[class*="faq" i], details' },
        { name: 'footer', selectors: 'footer, .footer' },
        { name: 'carousel', selectors: '.carousel, [class*="carousel" i], [data-bs-ride="carousel"]' },
        { name: 'accordions', selectors: '.accordion, [class*="accordion" i], details' },
        { name: 'tabs', selectors: '[role="tablist"], .tabs, [class*="tabs" i]' },
        { name: 'modals', selectors: '.modal, [class*="modal" i], dialog' },
        { name: 'galleries', selectors: '.gallery, [class*="gallery" i], [class*="grid" i] img' },
        { name: 'tables', selectors: 'table' },
      ];

      return registry.map((entry) => {
        const count = document.querySelectorAll(entry.selectors).length;
        return { name: entry.name, count, present: count > 0 };
      });
    });
  }

  private async collectButtons(page: Page): Promise<RawButtonSample[]> {
    return page.evaluate(function (): RawButtonSample[] {
      const selectors = 'button, a[role="button"], input[type="submit"], input[type="button"]';
      const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));

      return elements.map((element) => {
        const styles = window.getComputedStyle(element);

        return {
          classes: Array.from(element.classList),
          backgroundColor: styles.backgroundColor,
          textColor: styles.color,
          borderRadius: styles.borderRadius,
        };
      });
    });
  }

  private toLogoCandidates(rawCandidates: RawLogoCandidate[]): LogoCandidate[] {
    const scores = rawCandidates.map((candidate) => ({
      ...candidate,
      confidence: this.scoreLogo(candidate),
    }));

    return scores.sort((a, b) => b.confidence - a.confidence);
  }

  private pickMainLogo(rawCandidates: RawLogoCandidate[], favicon: string | null): LogoCandidate | null {
    const sorted = this.toLogoCandidates(rawCandidates);
    if (sorted.length) return sorted[0];

    if (!favicon) return null;

    return {
      url: favicon,
      selector: 'link[rel~="icon"]',
      strategy: 'favicon-fallback',
      confidence: 0.3,
      width: 0,
      height: 0,
    };
  }

  private scoreLogo(candidate: RawLogoCandidate): number {
    const area = Math.max(1, candidate.width * candidate.height);
    const normalizedArea = Math.min(area / 120000, 1);

    const strategyWeight: Record<RawLogoCandidate['strategy'], number> = {
      'header-image': 1,
      'class-logo': 0.9,
      'svg-logo': 0.75,
    };

    const score = 0.6 * strategyWeight[candidate.strategy] + 0.4 * normalizedArea;
    return Number(score.toFixed(3));
  }

  private buildPalette(styleSamples: RawStyleSample[], buttons: RawButtonSample[]) {
    const all = new Map<string, number>();
    const text = new Map<string, number>();
    const background = new Map<string, number>();
    const surface = new Map<string, number>();
    const accent = new Map<string, number>();

    styleSamples.forEach((sample) => {
      this.bumpColor(text, sample.color);
      this.bumpColor(background, sample.backgroundColor);
      if (sample.surface) this.bumpColor(surface, sample.backgroundColor);
      if (sample.interactive) this.bumpColor(accent, sample.color);
      this.bumpColor(all, sample.color);
      this.bumpColor(all, sample.backgroundColor);
      this.bumpColor(all, sample.borderColor);
    });

    buttons.forEach((button) => {
      this.bumpColor(all, button.backgroundColor);
      this.bumpColor(all, button.textColor);
      this.bumpColor(accent, button.backgroundColor);
    });

    const allColors = this.toColorUsage(all);
    const chromatic = allColors.filter((entry) => !this.isNeutral(entry.color));

    return {
      primary: chromatic[0]?.color ?? null,
      secondary: chromatic[1]?.color ?? null,
      accent: this.toColorUsage(accent)[0]?.color ?? chromatic[0]?.color ?? null,
      background: this.toColorUsage(background)[0]?.color ?? null,
      surface: this.toColorUsage(surface)[0]?.color ?? this.toColorUsage(background)[1]?.color ?? null,
      text: this.toColorUsage(text)[0]?.color ?? null,
      predominant: allColors.slice(0, 12),
      all: allColors.map((entry) => entry.color),
    };
  }

  private buildFonts(styleSamples: RawStyleSample[], resources: RawResourceSnapshot): FontUsage[] {
    const usage = new Map<string, { count: number; weights: Set<string> }>();

    styleSamples.forEach((sample) => {
      const family = this.extractPrimaryFont(sample.fontFamily);
      if (!family) return;

      const bucket = usage.get(family) ?? { count: 0, weights: new Set<string>() };
      bucket.count += 1;
      if (sample.fontWeight) bucket.weights.add(sample.fontWeight);
      usage.set(family, bucket);
    });

    resources.fontFaces.forEach((fontFace) => {
      const family = this.extractPrimaryFont(fontFace.family);
      if (!family) return;

      const bucket = usage.get(family) ?? { count: 0, weights: new Set<string>() };
      bucket.weights.add(fontFace.weight || '400');
      usage.set(family, bucket);
    });

    return Array.from(usage.entries())
      .map(([family, data]) => ({
        family,
        count: data.count,
        weights: Array.from(data.weights).sort(),
        origin: this.detectFontOrigin(family, resources),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private detectIconLibrary(resources: RawResourceSnapshot): { primary: IconLibraryDetection; detected: IconLibraryDetection[] } {
    const urls = [...resources.stylesheetUrls, ...resources.scriptUrls, ...resources.resourceUrls].join(' ').toLowerCase();
    const classes = resources.classNames.join(' ').toLowerCase();

    const detected = [
      this.buildIconDetection('font-awesome', /(fontawesome|font-awesome|\bfa[srb]?\b)/, urls, classes),
      this.buildIconDetection('bootstrap-icons', /(bootstrap-icons|\bbi\b)/, urls, classes),
      this.buildIconDetection('material-icons', /(material-icons|materialsymbols)/, urls, classes),
      this.buildIconDetection('lucide', /(lucide)/, urls, classes),
      this.buildIconDetection('heroicons', /(heroicons)/, urls, classes),
    ].filter((entry) => entry.confidence > 0);

    if (!detected.length && resources.svgCount > 0) {
      detected.push({ name: 'custom-svg', confidence: 0.6, evidence: ['Presença de elementos SVG no DOM'] });
    }

    const primary = detected[0] ?? { name: 'unknown', confidence: 0, evidence: [] };
    return { primary, detected: detected.sort((a, b) => b.confidence - a.confidence) };
  }

  private detectCssFramework(resources: RawResourceSnapshot): CssFrameworkDetection {
    const urls = [...resources.stylesheetUrls, ...resources.scriptUrls, ...resources.resourceUrls].join(' ').toLowerCase();
    const classes = resources.classNames.map((item) => item.toLowerCase());

    const detections: CssFrameworkDetection[] = [
      this.buildFrameworkDetection('bootstrap', /(bootstrap(\.min)?\.css|bootstrap(\.bundle)?\.min\.js)/, urls, classes, ['container', 'row']),
      this.buildFrameworkDetection('tailwind', /(tailwind|cdn\.tailwindcss\.com)/, urls, classes, ['bg-', 'text-', 'md:']),
      this.buildFrameworkDetection('bulma', /(bulma)/, urls, classes, ['columns', 'is-primary']),
      this.buildFrameworkDetection('foundation', /(foundation)/, urls, classes, ['grid-x', 'cell']),
      this.buildFrameworkDetection('materialize', /(materialize)/, urls, classes, ['waves-effect', 'material-icons']),
    ];

    const match = detections.sort((a, b) => b.confidence - a.confidence)[0];
    return match.confidence > 0 ? match : { name: 'custom', confidence: 0.2, evidence: ['Nenhum framework conhecido detectado'] };
  }

  private detectTheme(palette: BrandingExtractionResult['palette']): BrandingTheme {
    if (!palette.background || !palette.text) return 'mixed';

    const backgroundLuminance = this.colorLuminance(palette.background);
    const textLuminance = this.colorLuminance(palette.text);

    if (backgroundLuminance === null || textLuminance === null) return 'mixed';
    if (backgroundLuminance > 0.65 && textLuminance < 0.5) return 'light';
    if (backgroundLuminance < 0.35 && textLuminance > 0.5) return 'dark';
    return 'mixed';
  }

  private buildBorderRadius(styleSamples: RawStyleSample[], buttons: RawButtonSample[]): BorderRadiusProfile {
    const radiusCount = new Map<string, number>();
    styleSamples.forEach((sample) => this.bumpValue(radiusCount, sample.borderRadius));
    buttons.forEach((button) => this.bumpValue(radiusCount, button.borderRadius));

    const values = this.toValueUsage(radiusCount);
    return {
      predominant: values[0] ?? null,
      values,
    };
  }

  private buildSpacing(styleSamples: RawStyleSample[]): SpacingProfile {
    const marginCount = new Map<string, number>();
    const paddingCount = new Map<string, number>();
    const gapCount = new Map<string, number>();

    styleSamples.forEach((sample) => {
      this.bumpValue(marginCount, sample.margin);
      this.bumpValue(paddingCount, sample.padding);
      this.bumpValue(gapCount, sample.gap);
    });

    const margins = this.toValueUsage(marginCount);
    const paddings = this.toValueUsage(paddingCount);
    const gaps = this.toValueUsage(gapCount);

    return {
      predominantMargin: margins[0] ?? null,
      predominantPadding: paddings[0] ?? null,
      predominantGap: gaps[0] ?? null,
      margins,
      paddings,
      gaps,
    };
  }

  private buildButtonInsights(buttons: RawButtonSample[]): ButtonInsights {
    const classCount = new Map<string, number>();
    const styleCount = new Map<string, number>();
    const colorSet = new Set<string>();

    buttons.forEach((button) => {
      button.classes.forEach((className) => this.bumpValue(classCount, className));
      const backgroundColor = this.normalizeColor(button.backgroundColor) ?? TRANSPARENT;
      const textColor = this.normalizeColor(button.textColor) ?? TRANSPARENT;
      const borderRadius = this.normalizeCssValue(button.borderRadius);
      styleCount.set(`${backgroundColor}|${textColor}|${borderRadius}`, (styleCount.get(`${backgroundColor}|${textColor}|${borderRadius}`) ?? 0) + 1);
      if (backgroundColor !== TRANSPARENT) colorSet.add(backgroundColor);
      if (textColor !== TRANSPARENT) colorSet.add(textColor);
    });

    return {
      total: buttons.length,
      classFrequency: Array.from(classCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([className, count]) => ({ className, count })),
      predominantStyles: Array.from(styleCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([signature, count]) => {
          const [backgroundColor, textColor, borderRadius] = signature.split('|');
          return { backgroundColor, textColor, borderRadius, count };
        }),
      colors: Array.from(colorSet),
    };
  }

  private buildIconDetection(name: IconLibraryName, matcher: RegExp, urls: string, classes: string): IconLibraryDetection {
    const evidence: string[] = [];
    if (matcher.test(urls)) evidence.push('URL de recurso compatível');
    if (matcher.test(classes)) evidence.push('Classes compatíveis no DOM');

    return {
      name,
      confidence: evidence.length === 2 ? 0.95 : evidence.length === 1 ? 0.7 : 0,
      evidence,
    };
  }

  private buildFrameworkDetection(
    name: CssFrameworkDetection['name'],
    resourceMatcher: RegExp,
    urls: string,
    classes: string[],
    classHints: string[],
  ): CssFrameworkDetection {
    const evidence: string[] = [];
    if (resourceMatcher.test(urls)) evidence.push('Recurso externo detectado');

    const hintHits = classHints.filter((hint) => classes.some((className) => className.includes(hint)));
    if (hintHits.length) evidence.push(`Padrões de classes detectados: ${hintHits.join(', ')}`);

    const confidence = Math.min(0.98, evidence.length * 0.45 + hintHits.length * 0.08);
    return { name, confidence, evidence };
  }

  private extractPrimaryFont(fontFamily: string): string | null {
    const [first] = fontFamily.split(',');
    const normalized = first?.replace(/['"]/g, '').trim();
    return normalized ? normalized : null;
  }

  private detectFontOrigin(family: string, resources: RawResourceSnapshot): FontOrigin {
    const allUrls = [...resources.stylesheetUrls, ...resources.resourceUrls].join(' ').toLowerCase();
    const matchedFace = resources.fontFaces.find((face) => this.extractPrimaryFont(face.family)?.toLowerCase() === family.toLowerCase());
    const faceSource = matchedFace?.source?.toLowerCase() ?? '';

    if (/fonts\.googleapis\.com|gstatic/.test(allUrls) || /fonts\.googleapis\.com|gstatic/.test(faceSource)) return 'google-fonts';
    if (/use\.typekit|adobe/.test(allUrls) || /use\.typekit|adobe/.test(faceSource)) return 'adobe-fonts';
    if (matchedFace?.source && !/local\(/i.test(matchedFace.source)) return 'custom-webfont';
    if (/^(system-ui|arial|verdana|tahoma|times new roman|georgia|courier new|sans-serif|serif)$/i.test(family)) return 'system';
    return matchedFace?.source ? 'custom-webfont' : 'unknown';
  }

  private bumpColor(target: Map<string, number>, value: string): void {
    const color = this.normalizeColor(value);
    if (!color) return;
    target.set(color, (target.get(color) ?? 0) + 1);
  }

  private normalizeColor(value: string | null): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized.length || normalized === TRANSPARENT) return null;
    if (normalized === 'rgba(0, 0, 0, 0)' || normalized === 'rgba(0,0,0,0)') return null;

    if (normalized.startsWith('#')) return this.normalizeHex(normalized);

    const rgb = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgb) return null;

    return this.rgbToHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  }

  private normalizeHex(value: string): string {
    const hex = value.replace('#', '');

    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
    }

    if (hex.length === 8) return `#${hex.slice(0, 6)}`.toLowerCase();
    return `#${hex.slice(0, 6)}`.toLowerCase();
  }

  private rgbToHex(red: number, green: number, blue: number): string {
    const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  private toColorUsage(source: Map<string, number>): ColorUsage[] {
    return Array.from(source.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color, count]) => ({ color, count }));
  }

  private isNeutral(color: string): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return true;

    const max = Math.max(rgb.red, rgb.green, rgb.blue);
    const min = Math.min(rgb.red, rgb.green, rgb.blue);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation < 0.12;
  }

  private colorLuminance(color: string): number | null {
    const rgb = this.hexToRgb(color);
    if (!rgb) return null;

    const normalize = (value: number) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * normalize(rgb.red) + 0.7152 * normalize(rgb.green) + 0.0722 * normalize(rgb.blue);
  }

  private hexToRgb(color: string): { red: number; green: number; blue: number } | null {
    const match = color.match(/^#([a-f0-9]{6})$/i);
    if (!match) return null;

    const hex = match[1];
    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  private bumpValue(target: Map<string, number>, value: string): void {
    const normalized = this.normalizeCssValue(value);
    if (!normalized) return;
    target.set(normalized, (target.get(normalized) ?? 0) + 1);
  }

  private normalizeCssValue(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private toValueUsage(source: Map<string, number>): string[] {
    return Array.from(source.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value]) => value)
      .filter((value) => value !== '0px' && value !== '0px 0px 0px 0px' && value !== 'normal');
  }
}

export async function extractBranding(page: Page): Promise<BrandingExtractionResult> {
  return new BrandingExtractorService().extract(page);
}
