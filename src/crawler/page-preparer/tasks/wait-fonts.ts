/// <reference lib="dom" />
import { Page } from 'playwright';

export interface WaitFontsOptions {
  timeoutMs: number;
}

export const DEFAULT_WAIT_FONTS_OPTIONS: WaitFontsOptions = {
  timeoutMs: 10000,
};

export class WaitFontsTask {
  constructor(private readonly options: WaitFontsOptions = DEFAULT_WAIT_FONTS_OPTIONS) {}

  async run(page: Page): Promise<void> {
    try {
      await this.evaluate(page);
    } catch (error) {
      throw new Error(
        `WaitFontsTask failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async evaluate(page: Page): Promise<void> {
    await page.evaluate(({ timeoutMs }) => {
      // Normalize FontFaceSet to void so both sides of the race share the same type.
      const fontsReady = document.fonts.ready.then(() => undefined);
      const safeTimeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));

      // Resolves as soon as fonts are ready or the timeout expires — whichever comes first.
      // Promise.race propagates a rejection from fontsReady upward, handled by run()'s try-catch.
      return Promise.race([fontsReady, safeTimeout]);
    }, this.options);
  }
}
