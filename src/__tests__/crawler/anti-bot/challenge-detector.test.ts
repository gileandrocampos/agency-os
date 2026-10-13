import { describe, it, expect, vi } from 'vitest';
import type { Page } from 'playwright';
import { detectChallenge } from '../../../crawler/anti-bot/challenge-detector';

function makePageMock({ title, url, html }: { title: string; url: string; html: string }): Page {
  return {
    title: vi.fn().mockResolvedValue(title),
    url: vi.fn().mockReturnValue(url),
    content: vi.fn().mockResolvedValue(html),
  } as unknown as Page;
}

describe('detectChallenge', () => {
  it('retorna null quando detecção está desativada', async () => {
    const page = makePageMock({ title: 'Home', url: 'https://example.com', html: '<html></html>' });

    const result = await detectChallenge(page, { enabled: false, patterns: ['cloudflare'] });

    expect(result).toBeNull();
  });

  it('detecta challenge por título', async () => {
    const page = makePageMock({
      title: 'Just a moment...',
      url: 'https://example.com',
      html: '<html></html>',
    });

    const result = await detectChallenge(page, { enabled: true, patterns: ['just a moment'] });

    expect(result).toMatchObject({
      type: 'cloudflare',
      matchedPattern: 'just a moment',
      source: 'title',
    });
  });

  it('detecta challenge por HTML quando padrão aparece no body', async () => {
    const page = makePageMock({
      title: 'Home',
      url: 'https://example.com',
      html: '<html><body>verify you are human - cf-chl-bypass</body></html>',
    });

    const result = await detectChallenge(page, { enabled: true, patterns: ['verify you are human'] });

    expect(result?.type).toBe('captcha');
    expect(result?.source).toBe('html');
  });

  it('ignora captcha genérico no HTML quando não há marcador de bloqueio', async () => {
    const page = makePageMock({
      title: 'RRSafety Treinamentos',
      url: 'https://rrsafetytreinamentos.com.br',
      html: '<html><body><form><label>captcha</label><input name="captcha" /></form></body></html>',
    });

    const result = await detectChallenge(page, { enabled: true, patterns: ['captcha'] });

    expect(result).toBeNull();
  });

  it('ignora menção textual de cloudflare no HTML sem evidência de challenge real', async () => {
    const page = makePageMock({
      title: 'Empresa X',
      url: 'https://example.com',
      html: '<html><body>Nosso provedor de CDN é cloudflare</body></html>',
    });

    const result = await detectChallenge(page, { enabled: true, patterns: ['cloudflare'] });

    expect(result).toBeNull();
  });
});
