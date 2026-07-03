# Parser

## Responsabilidade

Receber o HTML renderizado e produzir um objeto estruturado com os dados básicos da página.

Não contém lógica de negócio, SEO ou exportação — apenas parsing.

---

## Módulos

```
src/parser/
  index.ts              ← interface pública (exports)
  site-parser.ts        ← função parseSite
  extractors.ts         ← funções puras de extração por campo (título, descrição, idioma, headings, etc.)
  metadata-extractor.ts ← função extractMetadata (metadados do <head>)
  types.ts              ← interfaces ParsedSite, SiteMetadata, Heading, Link, Image, OpenGraphMetadata, TwitterCardMetadata
```

---

## Interface pública

### `parseSite(html: string): ParsedSite`

Recebe uma string HTML renderizada e retorna um `ParsedSite`.

```ts
import { parseSite } from './parser';

const result = parseSite(html);
// result.title, result.description, result.headings, etc.
```

### `extractMetadata(html: string): SiteMetadata`

Recebe uma string HTML e retorna apenas os metadados presentes na tag `<head>`. Não extrai conteúdo visual.

```ts
import { extractMetadata } from './parser';

const metadata = extractMetadata(html);
// metadata.title, metadata.openGraph, metadata.twitterCard, etc.
```

---

## Tipo `ParsedSite`

```ts
interface ParsedSite {
  title: string | null;         // conteúdo de <title>
  description: string | null;   // content de <meta name="description">
  language: string | null;      // atributo lang de <html>
  headings: Heading[];          // todos os h1–h6 na ordem do documento
  paragraphs: string[];         // texto de cada <p> não vazio
  links: Link[];                // todos os <a href="...">
  images: Image[];              // todos os <img>
}

interface Heading {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
}

interface Link {
  href: string;
  text: string;
}

interface Image {
  src: string;
  alt: string;
}
```

## Tipo `SiteMetadata`

Objeto serializável contendo exclusivamente metadados da tag `<head>`:

```ts
interface SiteMetadata {
  title: string | null;        // <title>
  description: string | null;  // <meta name="description">
  keywords: string | null;     // <meta name="keywords">
  author: string | null;       // <meta name="author">
  viewport: string | null;     // <meta name="viewport">
  charset: string | null;      // <meta charset="...">
  robots: string | null;       // <meta name="robots">
  canonical: string | null;    // <link rel="canonical" href="...">
  openGraph: OpenGraphMetadata;
  twitterCard: TwitterCardMetadata;
}

interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
}

interface TwitterCardMetadata {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
}
```

---

## Dependências

- [cheerio](https://cheerio.js.org/) — parsing de HTML no lado servidor

---

## Testes

```
src/__tests__/parser/site-parser.test.ts
src/__tests__/parser/metadata-extractor.test.ts
```

Cobertura: happy path + casos de borda por campo + erro de parsing.
