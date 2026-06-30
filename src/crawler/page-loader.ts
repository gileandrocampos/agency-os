import { Page } from 'playwright';

export async function loadPage(page: Page, url: string): Promise<void> {
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}
