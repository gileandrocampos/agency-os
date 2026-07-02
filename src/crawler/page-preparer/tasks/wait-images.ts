/// <reference lib="dom" />
import { Page } from 'playwright';

export interface WaitImagesOptions {
  timeoutMs: number;
}

export const DEFAULT_WAIT_IMAGES_OPTIONS: WaitImagesOptions = {
  timeoutMs: 15000,
};

export class WaitImagesTask {
  constructor(private readonly options: WaitImagesOptions = DEFAULT_WAIT_IMAGES_OPTIONS) {}

  async run(page: Page): Promise<void> {
    try {
      await this.evaluate(page);
    } catch (error) {
      throw new Error(
        `WaitImagesTask failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async evaluate(page: Page): Promise<void> {
    await page.evaluate(({ timeoutMs }) => {
      const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'));

      // Object method shorthand avoids __name() injection by esbuild (tsx uses keepNames: true).
      // Arrow const assignments like `const fn = () => {}` get wrapped with __name(fn, "fn"),
      // which is a module-level helper not available in the browser context of page.evaluate.
      const loader = {
        waitForImage(img: HTMLImageElement): Promise<void> {
          // Already decoded and rendered — nothing to wait for.
          if (img.complete) return Promise.resolve();

          // Resolve on both load and error: a broken image is still a settled image.
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        },
      };

      // Typed as Promise<void[]> then cast via the outer Promise.race — no .then() cast needed.
      const allLoaded: Promise<void> = Promise.all(
        images.map((img) => loader.waitForImage(img)),
      ) as Promise<void>;
      const safeTimeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));

      return Promise.race([allLoaded, safeTimeout]);
    }, this.options);
  }
}
