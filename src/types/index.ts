import type { ParsedSite } from '../parser';
import type { SiteManifest } from '../manifest-builder';
import type { BrandingExtractionResult } from '../branding-extractor';

export type { ParsedSite };
export type { BrandingExtractionResult };

export interface CrawlerConfig {
  url: string;
  domain: string;
  timestamp: string;
  outputDir: string;
  logsDir: string;
}

export interface CrawlerResult {
  url: string;
  outputDir: string;
  screenshotDesktop: string;
  screenshotMobile: string;
  htmlFile: string;
  siteJsonFile: string;
  siteManifest: SiteManifest;
  parsedSite: ParsedSite;
  branding: BrandingExtractionResult;
}

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

export const DESKTOP_VIEWPORT: ViewportConfig = {
  width: 1280,
  height: 720,
  name: 'desktop',
};

export const MOBILE_VIEWPORT: ViewportConfig = {
  width: 375,
  height: 812,
  name: 'mobile',
};
