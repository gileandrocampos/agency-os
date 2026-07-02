import { Page } from 'playwright';
import { PreparationStep, PreparationStepResult } from '../../types/preparation';

export class ScrollActivator implements PreparationStep {
  readonly name = 'scroll-activator';

  constructor(
    private readonly scrollDelay: number,
    private readonly maxScrollSteps: number,
  ) {}

  async run(page: Page): Promise<PreparationStepResult> {
    const start = Date.now();
    try {
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = page.viewportSize()?.height ?? 768;
      const steps = Math.min(Math.ceil(scrollHeight / viewportHeight), this.maxScrollSteps);

      for (let i = 1; i <= steps; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), i * viewportHeight);
        await new Promise<void>((resolve) => setTimeout(resolve, this.scrollDelay));
      }

      await page.evaluate(() => window.scrollTo(0, 0));

      return {
        name: this.name,
        executed: true,
        success: true,
        durationMs: Date.now() - start,
        detail: `Scrolled ${steps} steps`,
      };
    } catch (error) {
      return {
        name: this.name,
        executed: true,
        success: false,
        durationMs: Date.now() - start,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
