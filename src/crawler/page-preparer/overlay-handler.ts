import { Page } from 'playwright';
import { PreparationStep, PreparationStepResult } from '../../types/preparation';
import { clickFirstMatch } from './click-first-match';

const CLOSE_SELECTORS = [
  '[aria-label="Close"]',
  '[aria-label="Fechar"]',
  '[aria-label="Dismiss"]',
  'button[class*="close"]',
  'button[id*="close"]',
  '.modal-close',
  '.popup-close',
  '[data-dismiss="modal"]',
  '[data-testid*="close"]',
];

export class OverlayHandler implements PreparationStep {
  readonly name = 'overlay-handler';

  async run(page: Page): Promise<PreparationStepResult> {
    const start = Date.now();
    const matched = await clickFirstMatch(page, CLOSE_SELECTORS);
    return {
      name: this.name,
      executed: true,
      success: true,
      durationMs: Date.now() - start,
      detail: matched ? `Dismissed with: ${matched}` : 'No overlay found',
    };
  }
}
