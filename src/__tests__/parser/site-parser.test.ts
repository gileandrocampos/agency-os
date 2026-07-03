import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { parseSite } from '../../parser/site-parser';
import * as logger from '../../logger';

const { loadMock } = vi.hoisted(() => ({ loadMock: vi.fn() }));
vi.mock('cheerio', () => ({ load: loadMock }));

const FULL_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <title>Meu Site</title>
    <meta name="description" content="Descrição do site" />
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>
    </header>
    <h1>Título Principal</h1>
    <h2>Subtítulo</h2>
    <h3>Seção</h3>
    <p>Primeiro parágrafo.</p>
    <p>Segundo parágrafo.</p>
    <a href="https://outside.com">Link externo</a>
    <a href="/sobre">Sobre</a>
    <footer>
      <a href="/contato">Contato</a>
    </footer>
    <img src="/logo.png" alt="Logo" />
    <img src="/banner.jpg" alt="" />
  </body>
</html>
`;

const EMPTY_HTML = `<!DOCTYPE html><html><head></head><body></body></html>`;

describe('parseSite', () => {
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

  describe('título', () => {
    it('extrai o título da página', () => {
      const result = parseSite(FULL_HTML);
      expect(result.title).toBe('Meu Site');
    });

    it('retorna null quando não há título', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.title).toBeNull();
    });
  });

  describe('meta description', () => {
    it('extrai a meta description', () => {
      const result = parseSite(FULL_HTML);
      expect(result.description).toBe('Descrição do site');
    });

    it('retorna null quando não há meta description', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.description).toBeNull();
    });
  });

  describe('idioma', () => {
    it('extrai o atributo lang do elemento html', () => {
      const result = parseSite(FULL_HTML);
      expect(result.language).toBe('pt-BR');
    });

    it('retorna null quando não há atributo lang', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.language).toBeNull();
    });
  });

  describe('headings', () => {
    it('extrai os headings na ordem do documento', () => {
      const result = parseSite(FULL_HTML);
      expect(result.headings).toEqual([
        { level: 'h1', text: 'Título Principal' },
        { level: 'h2', text: 'Subtítulo' },
        { level: 'h3', text: 'Seção' },
      ]);
    });

    it('retorna array vazio quando não há headings', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.headings).toEqual([]);
    });

    it('ignora headings com texto vazio', () => {
      const html = `<html><body><h1>  </h1><h2>Válido</h2></body></html>`;
      const result = parseSite(html);
      expect(result.headings).toEqual([{ level: 'h2', text: 'Válido' }]);
    });
  });

  describe('parágrafos', () => {
    it('extrai o texto de todos os parágrafos', () => {
      const result = parseSite(FULL_HTML);
      expect(result.paragraphs).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.']);
    });

    it('retorna array vazio quando não há parágrafos', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.paragraphs).toEqual([]);
    });

    it('ignora parágrafos com texto vazio', () => {
      const html = `<html><body><p>  </p><p>Conteúdo</p></body></html>`;
      const result = parseSite(html);
      expect(result.paragraphs).toEqual(['Conteúdo']);
    });
  });

  describe('links', () => {
    it('extrai href e texto de todos os links com atributo href', () => {
      const result = parseSite(FULL_HTML);
      expect(result.links).toEqual([
        { href: '/', text: 'Home' },
        { href: 'https://outside.com', text: 'Link externo' },
        { href: '/sobre', text: 'Sobre' },
        { href: '/contato', text: 'Contato' },
      ]);
    });

    it('retorna array vazio quando não há links', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.links).toEqual([]);
    });

    it('ignora âncoras sem atributo href', () => {
      const html = `<html><body><a>Sem href</a><a href="/ok">Com href</a></body></html>`;
      const result = parseSite(html);
      expect(result.links).toEqual([{ href: '/ok', text: 'Com href' }]);
    });

    it('ignora âncoras com href vazio ou só com espaços', () => {
      const html = `<html><body><a href="">Vazio</a><a href="   ">Espaços</a><a href="/ok">Com href</a></body></html>`;
      const result = parseSite(html);
      expect(result.links).toEqual([{ href: '/ok', text: 'Com href' }]);
    });
  });

  describe('imagens', () => {
    it('extrai src e alt de todas as imagens', () => {
      const result = parseSite(FULL_HTML);
      expect(result.images).toEqual([
        { src: '/logo.png', alt: 'Logo' },
        { src: '/banner.jpg', alt: '' },
      ]);
    });

    it('retorna array vazio quando não há imagens', () => {
      const result = parseSite(EMPTY_HTML);
      expect(result.images).toEqual([]);
    });

    it('usa string vazia quando alt está ausente', () => {
      const html = `<html><body><img src="/img.png" /></body></html>`;
      const result = parseSite(html);
      expect(result.images).toEqual([{ src: '/img.png', alt: '' }]);
    });

    it('ignora imagens com src vazio ou só com espaços', () => {
      const html = `<html><body><img src="" alt="Vazio" /><img src="   " alt="Espaços" /><img src="/img.png" alt="Ok" /></body></html>`;
      const result = parseSite(html);
      expect(result.images).toEqual([{ src: '/img.png', alt: 'Ok' }]);
    });
  });

  describe('navigation', () => {
    it('extrai menu principal e footer', () => {
      const result = parseSite(FULL_HTML, 'https://example.com');

      expect(result.navigation.mainMenu).toEqual([{ href: '/', text: 'Home' }]);
      expect(result.navigation.footerMenu).toEqual([{ href: '/contato', text: 'Contato' }]);
    });

    it('classifica links internos e externos com base na URL informada', () => {
      const result = parseSite(FULL_HTML, 'https://example.com');

      expect(result.navigation.internalLinks).toContainEqual({ href: '/sobre', text: 'Sobre' });
      expect(result.navigation.internalLinks).toContainEqual({ href: '/contato', text: 'Contato' });
      expect(result.navigation.externalLinks).toContainEqual({ href: 'https://outside.com', text: 'Link externo' });
    });

    it('retorna estrutura serializável no resultado final', () => {
      const result = parseSite(FULL_HTML, 'https://example.com');
      const serialized = JSON.stringify(result.navigation);

      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toMatchObject(result.navigation);
    });
  });

  describe('logs', () => {
    it('registra início e sucesso ao parsear', () => {
      parseSite(FULL_HTML);
      expect(logStartSpy).toHaveBeenCalledOnce();
      expect(logSuccessSpy).toHaveBeenCalledOnce();
    });
  });

  describe('tratamento de erros', () => {
    it('registra erro e relança a exceção quando o parsing falha', () => {
      loadMock.mockImplementationOnce(() => {
        throw new Error('Falha simulada');
      });

      expect(() => parseSite(FULL_HTML)).toThrow('Falha simulada');
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
