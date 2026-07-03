import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { extractMetadata } from '../../parser/metadata-extractor';
import * as logger from '../../logger';

const { loadMock } = vi.hoisted(() => ({ loadMock: vi.fn() }));
vi.mock('cheerio', () => ({ load: loadMock }));

const FULL_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Meu Site Incrível</title>
    <meta name="description" content="Descrição completa do site" />
    <meta name="keywords" content="typescript, node, playwright" />
    <meta name="author" content="Gileandro Campos" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://meusite.com.br/" />
    <meta property="og:title" content="Meu Site OG" />
    <meta property="og:description" content="Descrição OG" />
    <meta property="og:image" content="https://meusite.com.br/og.png" />
    <meta property="og:url" content="https://meusite.com.br/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Meu Site" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Meu Site Twitter" />
    <meta name="twitter:description" content="Descrição Twitter" />
    <meta name="twitter:image" content="https://meusite.com.br/twitter.png" />
  </head>
  <body>
    <h1>Conteúdo visual (não deve ser extraído)</h1>
  </body>
</html>
`;

const EMPTY_HTML = `<!DOCTYPE html><html><head></head><body></body></html>`;

describe('extractMetadata', () => {
  let logStartSpy: ReturnType<typeof vi.spyOn>;
  let logSuccessSpy: ReturnType<typeof vi.spyOn>;
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    const real = await vi.importActual<typeof import('cheerio')>('cheerio');
    loadMock.mockImplementation(real.load);
  });

  beforeEach(() => {
    logStartSpy = vi.spyOn(logger, 'logStart').mockImplementation(() => {});
    logSuccessSpy = vi.spyOn(logger, 'logSuccess').mockImplementation(() => {});
    logErrorSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {});
  });

  afterEach(() => {
    logStartSpy.mockRestore();
    logSuccessSpy.mockRestore();
    logErrorSpy.mockRestore();
  });

  describe('title', () => {
    it('extrai o título da tag <title> dentro do <head>', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.title).toBe('Meu Site Incrível');
    });

    it('retorna null quando não há tag <title>', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.title).toBeNull();
    });
  });

  describe('description', () => {
    it('extrai a meta description', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.description).toBe('Descrição completa do site');
    });

    it('retorna null quando não há meta description', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.description).toBeNull();
    });
  });

  describe('keywords', () => {
    it('extrai as meta keywords', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.keywords).toBe('typescript, node, playwright');
    });

    it('retorna null quando não há meta keywords', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.keywords).toBeNull();
    });
  });

  describe('author', () => {
    it('extrai o meta author', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.author).toBe('Gileandro Campos');
    });

    it('retorna null quando não há meta author', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.author).toBeNull();
    });
  });

  describe('viewport', () => {
    it('extrai o meta viewport', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.viewport).toBe('width=device-width, initial-scale=1.0');
    });

    it('retorna null quando não há meta viewport', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.viewport).toBeNull();
    });
  });

  describe('charset', () => {
    it('extrai o charset da meta tag', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.charset).toBe('UTF-8');
    });

    it('retorna null quando não há declaração de charset', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.charset).toBeNull();
    });
  });

  describe('robots', () => {
    it('extrai a diretiva robots', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.robots).toBe('index, follow');
    });

    it('retorna null quando não há meta robots', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.robots).toBeNull();
    });
  });

  describe('canonical', () => {
    it('extrai a URL canônica', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.canonical).toBe('https://meusite.com.br/');
    });

    it('retorna null quando não há link canonical', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.canonical).toBeNull();
    });
  });

  describe('Open Graph', () => {
    it('extrai todos os campos Open Graph quando presentes', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.openGraph).toEqual({
        title: 'Meu Site OG',
        description: 'Descrição OG',
        image: 'https://meusite.com.br/og.png',
        url: 'https://meusite.com.br/',
        type: 'website',
        siteName: 'Meu Site',
      });
    });

    it('retorna todos os campos Open Graph como null quando ausentes', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.openGraph).toEqual({
        title: null,
        description: null,
        image: null,
        url: null,
        type: null,
        siteName: null,
      });
    });
  });

  describe('Twitter Card', () => {
    it('extrai todos os campos Twitter Card quando presentes', () => {
      const result = extractMetadata(FULL_HTML);
      expect(result.twitterCard).toEqual({
        card: 'summary_large_image',
        title: 'Meu Site Twitter',
        description: 'Descrição Twitter',
        image: 'https://meusite.com.br/twitter.png',
      });
    });

    it('retorna todos os campos Twitter Card como null quando ausentes', () => {
      const result = extractMetadata(EMPTY_HTML);
      expect(result.twitterCard).toEqual({
        card: null,
        title: null,
        description: null,
        image: null,
      });
    });
  });

  describe('isolamento do <head>', () => {
    it('não extrai conteúdo do <body>', () => {
      const htmlWithBodyTitle = `
        <!DOCTYPE html>
        <html>
          <head><title>Título do Head</title></head>
          <body><title>Título do Body (deve ser ignorado)</title></body>
        </html>
      `;
      const result = extractMetadata(htmlWithBodyTitle);
      expect(result.title).toBe('Título do Head');
    });

    it('ignora metatags no <body>', () => {
      const htmlWithBodyMeta = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="description" content="Descrição do Head" />
            <meta property="og:title" content="OG do Head" />
            <meta charset="UTF-8" />
          </head>
          <body>
            <meta name="description" content="Descrição do Body (ignorar)" />
            <meta property="og:title" content="OG do Body (ignorar)" />
            <meta charset="ISO-8859-1" />
          </body>
        </html>
      `;
      const result = extractMetadata(htmlWithBodyMeta);

      expect(result.description).toBe('Descrição do Head');
      expect(result.openGraph.title).toBe('OG do Head');
      expect(result.charset).toBe('UTF-8');
    });
  });

  describe('logs', () => {
    it('registra log de início e sucesso', () => {
      extractMetadata(FULL_HTML);
      expect(logStartSpy).toHaveBeenCalledOnce();
      expect(logSuccessSpy).toHaveBeenCalledOnce();
    });

    it('registra log de erro e relança exceção quando cheerio falha', () => {
      loadMock.mockImplementationOnce(() => {
        throw new Error('parse error simulado');
      });

      expect(() => extractMetadata(FULL_HTML)).toThrow('parse error simulado');
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
