import { chromium } from 'patchright';
import type { Page } from 'playwright';
import { BrowserFingerprintProfile, selectSessionFingerprint } from './anti-bot/fingerprint-rotator';

export interface BrowserSession {
  page: Page;
  close: () => Promise<void>;
}

export interface BrowserSessionConfig {
  headless: boolean;
  slowMoMs: number;
  antiBot: {
    enabled: boolean;
    rotateFingerprint: boolean;
    fingerprints: BrowserFingerprintProfile[];
  };
}

const DEFAULT_BROWSER_CONFIG: BrowserSessionConfig = {
  headless: false,
  slowMoMs: 500,
  antiBot: {
    enabled: true,
    rotateFingerprint: true,
    fingerprints: [],
  },
};

export async function createBrowserSession(config: BrowserSessionConfig = DEFAULT_BROWSER_CONFIG): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMoMs,
  });
  const contextOptions = buildContextOptions(config);
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  assertBrowserPageContract(page);

  return {
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

function assertBrowserPageContract(page: unknown): asserts page is Page {
  if (typeof page !== 'object' || page === null) {
    throw new Error('Sessão inválida: página do browser não foi criada corretamente');
  }

  const candidate = page as Record<string, unknown>;
  const requiredMethods = [
    'goto',
    'title',
    'url',
    'content',
    'evaluate',
    'locator',
    'waitForLoadState',
    'setViewportSize',
    'screenshot',
  ] as const;

  const hasAllMethods = requiredMethods.every((methodName) => typeof candidate[methodName] === 'function');

  if (!hasAllMethods) {
    throw new Error('Sessão inválida: contrato da página não é compatível com o crawler');
  }
}

function buildContextOptions(config: BrowserSessionConfig): Record<string, unknown> {
  const fingerprint = selectSessionFingerprint({
    enabled: config.antiBot.enabled,
    rotate: config.antiBot.rotateFingerprint,
    profiles: config.antiBot.fingerprints,
  });

  if (fingerprint === null) {
    return {};
  }

  return {
    userAgent: fingerprint.userAgent,
    locale: fingerprint.locale,
    viewport: fingerprint.viewport,
    isMobile: fingerprint.isMobile,
    hasTouch: fingerprint.hasTouch,
    deviceScaleFactor: fingerprint.deviceScaleFactor,
    extraHTTPHeaders: fingerprint.extraHeaders,
  };
}
