import { describe, it, expect, vi } from 'vitest';
import * as path from 'path';
import type { Page } from 'playwright';
import { captureScreenshot } from '../../crawler/screenshot';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from '../../types';

function makeMockPage(): Partial<Page> & {
  setViewportSize: ReturnType<typeof vi.fn>;
  screenshot: ReturnType<typeof vi.fn>;
} {
  return {
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(undefined),
  };
}

describe('captureScreenshot', () => {
  it('chama setViewportSize com dimensões do viewport', async () => {
    const page = makeMockPage();
    await captureScreenshot(page as Page, DESKTOP_VIEWPORT, '/out');
    expect(page.setViewportSize).toHaveBeenCalledWith({
      width: DESKTOP_VIEWPORT.width,
      height: DESKTOP_VIEWPORT.height,
    });
  });

  it('chama page.screenshot com fullPage: true', async () => {
    const page = makeMockPage();
    await captureScreenshot(page as Page, DESKTOP_VIEWPORT, '/out');
    const args = page.screenshot.mock.calls[0][0];
    expect(args.fullPage).toBe(true);
  });

  it('salva screenshot com nome baseado no viewport', async () => {
    const page = makeMockPage();
    await captureScreenshot(page as Page, DESKTOP_VIEWPORT, '/out');
    const args = page.screenshot.mock.calls[0][0];
    expect(args.path).toContain('screenshot-desktop.png');
  });

  it('retorna o caminho do arquivo gerado para desktop', async () => {
    const page = makeMockPage();
    const result = await captureScreenshot(page as Page, DESKTOP_VIEWPORT, '/out');
    expect(result).toBe(path.join('/out', 'screenshot-desktop.png'));
  });

  it('retorna o caminho correto para viewport mobile', async () => {
    const page = makeMockPage();
    const result = await captureScreenshot(page as Page, MOBILE_VIEWPORT, '/out');
    expect(result).toBe(path.join('/out', 'screenshot-mobile.png'));
  });

  it('chama setViewportSize antes de screenshot', async () => {
    const callOrder: string[] = [];
    const page = makeMockPage();
    page.setViewportSize.mockImplementation(async () => { callOrder.push('setViewport'); });
    page.screenshot.mockImplementation(async () => { callOrder.push('screenshot'); });

    await captureScreenshot(page as Page, DESKTOP_VIEWPORT, '/out');
    expect(callOrder).toEqual(['setViewport', 'screenshot']);
  });
});
