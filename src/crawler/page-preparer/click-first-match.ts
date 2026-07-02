import { Page } from 'playwright';

export const SELECTOR_CLICK_TIMEOUT_MS = 2000;

export async function clickFirstMatch(
  page: Page,
  selectors: readonly string[],
  timeoutMs = SELECTOR_CLICK_TIMEOUT_MS,
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().click({ timeout: timeoutMs });
      return selector;
    } catch {
      // try next selector
    }
  }
  return null;
}
