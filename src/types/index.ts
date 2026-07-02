import type { ParsedSite } from '../parser/types';

export type { ParsedSite };

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
  parsedSite: ParsedSite;
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
