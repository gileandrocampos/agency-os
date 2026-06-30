import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserSession } from '../../crawler/browser';

const { mockPage, mockContext, mockBrowser } = vi.hoisted(() => {
  const mockPage = {};
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

vi.mock('playwright', () => ({
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
    const { chromium } = await import('playwright');
    await createBrowserSession();
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
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
});
