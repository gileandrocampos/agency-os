import { chromium, BrowserContext, Page } from 'playwright';

export interface BrowserSession {
  page: Page;
  close: () => Promise<void>;
}

export async function createBrowserSession(): Promise<BrowserSession> {
  const browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();

  return {
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}
