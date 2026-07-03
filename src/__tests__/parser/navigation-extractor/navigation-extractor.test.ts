import { describe, it, expect } from 'vitest';
import { load } from 'cheerio';
import { extractNavigation } from '../../../parser/navigation-extractor';

const HTML_WITH_NAVIGATION = `
<!DOCTYPE html>
<html>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">Sobre</a>
        <a href="https://blog.example.com">Blog</a>
      </nav>
    </header>

    <main>
      <a href="/services">Serviços</a>
      <a href="https://external.com">Parceiro</a>
      <a href="#section">Âncora</a>
      <a href="mailto:contato@example.com">Contato</a>
    </main>

    <footer>
      <a href="/privacy">Privacidade</a>
      <a href="https://instagram.com/example">Instagram</a>
    </footer>
  </body>
</html>
`;

describe('extractNavigation', () => {
  it('extrai links do menu principal e do footer', () => {
    const $ = load(HTML_WITH_NAVIGATION);
    const result = extractNavigation($, 'https://example.com');

    expect(result.mainMenu).toEqual([
      { href: '/', text: 'Home' },
      { href: '/about', text: 'Sobre' },
      { href: 'https://blog.example.com', text: 'Blog' },
    ]);
    expect(result.footerMenu).toEqual([
      { href: '/privacy', text: 'Privacidade' },
      { href: 'https://instagram.com/example', text: 'Instagram' },
    ]);
  });

  it('classifica links internos e externos usando a URL base', () => {
    const $ = load(HTML_WITH_NAVIGATION);
    const result = extractNavigation($, 'https://example.com');

    expect(result.internalLinks).toEqual([
      { href: '/', text: 'Home' },
      { href: '/about', text: 'Sobre' },
      { href: '/services', text: 'Serviços' },
      { href: '/privacy', text: 'Privacidade' },
    ]);
    expect(result.externalLinks).toEqual([
      { href: 'https://blog.example.com', text: 'Blog' },
      { href: 'https://external.com', text: 'Parceiro' },
      { href: 'https://instagram.com/example', text: 'Instagram' },
    ]);
  });

  it('ignora links de ancora e protocolos nao navegaveis', () => {
    const $ = load(HTML_WITH_NAVIGATION);
    const result = extractNavigation($, 'https://example.com');

    expect(result.internalLinks).not.toContainEqual({ href: '#section', text: 'Âncora' });
    expect(result.internalLinks).not.toContainEqual({ href: 'mailto:contato@example.com', text: 'Contato' });
    expect(result.externalLinks).not.toContainEqual({ href: '#section', text: 'Âncora' });
    expect(result.externalLinks).not.toContainEqual({ href: 'mailto:contato@example.com', text: 'Contato' });
  });

  it('classifica links sem URL base usando heuristica absoluta/relativa', () => {
    const $ = load('<html><body><a href="/interno">Interno</a><a href="https://externo.com">Externo</a></body></html>');
    const result = extractNavigation($);

    expect(result.internalLinks).toEqual([{ href: '/interno', text: 'Interno' }]);
    expect(result.externalLinks).toEqual([{ href: 'https://externo.com', text: 'Externo' }]);
  });

  it('retorna estrutura serializavel em JSON', () => {
    const $ = load(HTML_WITH_NAVIGATION);
    const result = extractNavigation($, 'https://example.com');
    const serialized = JSON.stringify(result);

    expect(typeof serialized).toBe('string');
    expect(JSON.parse(serialized)).toMatchObject(result);
  });
});