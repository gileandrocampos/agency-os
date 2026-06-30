import { describe, it, expect } from 'vitest';
import { validateUrl, extractDomain } from '../../utils/url-validator';

describe('validateUrl', () => {
  it('aceita URL https válida', () => {
    const url = validateUrl('https://example.com');
    expect(url).toBeInstanceOf(URL);
    expect(url.href).toBe('https://example.com/');
  });

  it('aceita URL http válida', () => {
    const url = validateUrl('http://example.com');
    expect(url.protocol).toBe('http:');
  });

  it('aceita URL com caminho e query string', () => {
    const url = validateUrl('https://example.com/path?q=1');
    expect(url.pathname).toBe('/path');
    expect(url.search).toBe('?q=1');
  });

  it('lança erro para URL sem protocolo http/https', () => {
    expect(() => validateUrl('ftp://example.com')).toThrowError(
      'Protocolo não suportado: "ftp:". Use http ou https.',
    );
  });

  it('lança erro para string que não é URL (TypeError)', () => {
    expect(() => validateUrl('nao-e-url')).toThrowError(
      /URL inválida: "nao-e-url"/,
    );
  });

  it('lança erro para string vazia', () => {
    expect(() => validateUrl('')).toThrowError(/URL inválida/);
  });

  it('lança erro para URL com protocolo javascript:', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrowError(
      /Protocolo não suportado/,
    );
  });
});

describe('extractDomain', () => {
  it('remove o prefixo www.', () => {
    const url = new URL('https://www.example.com');
    expect(extractDomain(url)).toBe('example.com');
  });

  it('mantém domínio sem www', () => {
    const url = new URL('https://example.com');
    expect(extractDomain(url)).toBe('example.com');
  });

  it('mantém subdomínio diferente de www', () => {
    const url = new URL('https://app.example.com');
    expect(extractDomain(url)).toBe('app.example.com');
  });

  it('lida com domínio .com.br', () => {
    const url = new URL('https://www.site.com.br');
    expect(extractDomain(url)).toBe('site.com.br');
  });

  it('retorna apenas hostname, sem path', () => {
    const url = new URL('https://example.com/path/to/page');
    expect(extractDomain(url)).toBe('example.com');
  });
});
