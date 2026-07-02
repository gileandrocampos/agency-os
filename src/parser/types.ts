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
