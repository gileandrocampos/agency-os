import { Page } from 'playwright';
import { PreparationStep, PreparationStepResult } from '../../types/preparation';
import { clickFirstMatch } from './click-first-match';

const COOKIE_SELECTORS = [
  'button:has-text("Accept all")',
  'button:has-text("Accept cookies")',
  'button:has-text("Accept")',
  'button:has-text("Aceitar tudo")',
  'button:has-text("Aceitar cookies")',
  'button:has-text("Aceitar")',
  '[id*="accept"][id*="cookie"]',
  '[class*="accept"][class*="cookie"]',
  '[aria-label*="accept cookies" i]',
  '[aria-label*="aceitar cookies" i]',
];

export class CookieHandler implements PreparationStep {
  readonly name = 'cookie-handler';

  async run(page: Page): Promise<PreparationStepResult> {
    const start = Date.now();
    const matched = await clickFirstMatch(page, COOKIE_SELECTORS);
    return {
      name: this.name,
      executed: true,
      success: true,
      durationMs: Date.now() - start,
      detail: matched ? `Dismissed with: ${matched}` : 'No cookie banner found',
    };
  }
}
