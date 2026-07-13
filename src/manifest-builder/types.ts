import type {
  BrandingExtractionResult,
  Heading,
  Image,
  Link,
  NavigationData,
  ParsedSite,
  SiteMetadata,
} from '../parser';

export type EmptySection = Record<string, never>;

export interface ManifestArtifacts {
  htmlFile: string;
  screenshots: {
    desktop: string;
    mobile: string;
  };
}

export interface ManifestSource {
  url: string;
  domain: string;
  timestamp: string;
  outputDir: string;
  artifacts: ManifestArtifacts;
}

export interface ManifestSeoAnalysis {
  metadata: SiteMetadata;
  audit: EmptySection;
}

export interface ManifestUxAnalysis {
  audit: EmptySection;
}

export interface ManifestPerformanceAnalysis {
  audit: EmptySection;
}

export interface ManifestAnalysis {
  seo: ManifestSeoAnalysis;
  ux: ManifestUxAnalysis;
  performance: ManifestPerformanceAnalysis;
}

export interface ManifestGenerators {
  designSystem: EmptySection;
  wireframes: EmptySection;
}

export interface ManifestIntegrations {
  ai: EmptySection;
  googleMaps: EmptySection;
}

export interface ManifestPlatform {
  saas: EmptySection;
}

export interface ManifestContent {
  language: string | null;
  headings: Heading[];
  paragraphs: string[];
  links: Link[];
  navigation: NavigationData;
  images: Image[];
}

export interface SiteManifest {
  schemaVersion: string;
  source: ManifestSource;
  content: ManifestContent;
  branding: BrandingExtractionResult;
  analysis: ManifestAnalysis;
  generators: ManifestGenerators;
  integrations: ManifestIntegrations;
  platform: ManifestPlatform;
}

export interface ManifestBuilderInput {
  url: string;
  domain: string;
  timestamp: string;
  outputDir: string;
  htmlFile: string;
  screenshotDesktop: string;
  screenshotMobile: string;
  parsedSite: ParsedSite;
  metadata: SiteMetadata;
  branding: BrandingExtractionResult;
}