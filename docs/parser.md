# Parser

## Responsabilidade

Receber o HTML renderizado e produzir um objeto estruturado com os dados básicos da página.

Não contém lógica de negócio, SEO ou exportação — apenas parsing.

---

## Módulos

```
src/parser/
  index.ts        ← interface pública (exports)
  site-parser.ts  ← função parseSite
  extractors.ts   ← funções puras de extração por campo
  types.ts        ← interfaces ParsedSite, Heading, Link, Image
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

---

## Dependências

- [cheerio](https://cheerio.js.org/) — parsing de HTML no lado servidor

---

## Testes

```
src/__tests__/parser/site-parser.test.ts
```

Cobertura: happy path + casos de borda por campo + erro de parsing.
