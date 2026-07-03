export interface Heading {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
}

export interface Link {
  href: string;
  text: string;
}

export interface Image {
  src: string;
  alt: string;
}

export interface ParsedSite {
  title: string | null;
  description: string | null;
  language: string | null;
  headings: Heading[];
  paragraphs: string[];
  links: Link[];
  images: Image[];
}

export interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
}

export interface TwitterCardMetadata {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
}

export interface SiteMetadata {
  title: string | null;
  description: string | null;
  keywords: string | null;
  author: string | null;
  viewport: string | null;
  charset: string | null;
  robots: string | null;
  canonical: string | null;
  openGraph: OpenGraphMetadata;
  twitterCard: TwitterCardMetadata;
}
