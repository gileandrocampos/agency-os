import { Page } from 'playwright';

export async function loadPage(
  page: Page,
  url: string,
  beforeNavigationDelay?: () => Promise<number>,
): Promise<void> {
  if (beforeNavigationDelay !== undefined) {
    await beforeNavigationDelay();
  }

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}
