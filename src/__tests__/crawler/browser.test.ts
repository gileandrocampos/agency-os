import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserSession } from '../../crawler/browser';

const { mockPage, mockContext, mockBrowser } = vi.hoisted(() => {
  const mockPage = {
    goto: vi.fn(),
    title: vi.fn(),
    url: vi.fn(),
    content: vi.fn(),
    evaluate: vi.fn(),
    locator: vi.fn(),
    waitForLoadState: vi.fn(),
    setViewportSize: vi.fn(),
    screenshot: vi.fn(),
  };
  const mockContext = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockBrowser = {
    newContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined),
  };
  return { mockPage, mockContext, mockBrowser };
});

vi.mock('patchright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  },
}));

describe('createBrowserSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.newPage.mockResolvedValue(mockPage);
    mockContext.close.mockResolvedValue(undefined);
    mockBrowser.newContext.mockResolvedValue(mockContext);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  it('retorna um objeto com page e close', async () => {
    const session = await createBrowserSession();
    expect(session).toHaveProperty('page');
    expect(session).toHaveProperty('close');
    expect(typeof session.close).toBe('function');
  });

  it('a page retornada é a criada pelo contexto', async () => {
    const session = await createBrowserSession();
    expect(session.page).toBe(mockPage);
  });

  it('lança chromium com headless: true', async () => {
    const { chromium } = await import('patchright');
    await createBrowserSession();
    expect(chromium.launch).toHaveBeenCalledWith({ headless: false, slowMo: 500 });
  });

  it('aplica fingerprint no contexto quando anti-bot está habilitado', async () => {
    await createBrowserSession({
      headless: true,
      slowMoMs: 0,
      antiBot: {
        enabled: true,
        rotateFingerprint: false,
        fingerprints: [
          {
            name: 'perfil-teste',
            userAgent: 'Mozilla/5.0 Teste',
            viewportWidth: 1280,
            viewportHeight: 720,
            platform: 'Windows',
            locale: 'pt-BR',
            acceptLanguage: 'pt-BR,pt;q=0.9',
            isMobile: false,
            hasTouch: false,
            deviceScaleFactor: 1,
          },
        ],
      },
    });

    expect(mockBrowser.newContext).toHaveBeenCalledWith(expect.objectContaining({
      userAgent: 'Mozilla/5.0 Teste',
      locale: 'pt-BR',
      viewport: { width: 1280, height: 720 },
    }));
  });

  it('close() chama context.close e browser.close', async () => {
    const session = await createBrowserSession();
    await session.close();
    expect(mockContext.close).toHaveBeenCalledOnce();
    expect(mockBrowser.close).toHaveBeenCalledOnce();
  });

  it('close() chama context.close antes de browser.close', async () => {
    const callOrder: string[] = [];
    mockContext.close.mockImplementation(async () => { callOrder.push('context'); });
    mockBrowser.close.mockImplementation(async () => { callOrder.push('browser'); });

    const session = await createBrowserSession();
    await session.close();
    expect(callOrder).toEqual(['context', 'browser']);
  });

  it('lança erro quando página não implementa contrato mínimo esperado', async () => {
    mockContext.newPage.mockResolvedValueOnce({});

    await expect(createBrowserSession()).rejects.toThrow('Sessão inválida: contrato da página não é compatível com o crawler');
  });
});
