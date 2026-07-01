/// <reference lib="dom" />
import { Page } from 'playwright';

export interface WaitDomOptions {
  idleMs: number;
  timeoutMs: number;
}

export const DEFAULT_WAIT_DOM_OPTIONS: WaitDomOptions = {
  idleMs: 500,
  timeoutMs: 5000,
};

export class WaitDomTask {
  constructor(private readonly options: WaitDomOptions = DEFAULT_WAIT_DOM_OPTIONS) {}

  // Separates error handling (run) from Playwright execution (evaluate).
  async run(page: Page): Promise<void> {
    try {
      await this.evaluate(page);
    } catch (error) {
      throw new Error(
        `WaitDomTask failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async evaluate(page: Page): Promise<void> {
    await page.evaluate(({ idleMs, timeoutMs }) => {
      return new Promise<void>((resolve) => {
        if (!document.body) {
          resolve();
          return;
        }

        // `settled` guard prevents resolveOnce from being called more than once
        // in the unlikely event both timers fire in the same event loop tick.
        let settled = false;
        let idleTimer: ReturnType<typeof setTimeout> | undefined;

        // Object method shorthand avoids __name() injection by esbuild (tsx uses keepNames: true).
        // Arrow const assignments like `const fn = () => {}` get wrapped with __name(fn, "fn"),
        // which is a module-level helper not available in the browser context of page.evaluate.
        const handlers = {
          resolveOnce() {
            if (settled) return;
            settled = true;
            observer.disconnect();
            clearTimeout(safetyTimer);
            clearTimeout(idleTimer);
            resolve();
          },
          // Replaces the pending idle timer with a fresh one on each DOM mutation.
          scheduleIdle() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => handlers.resolveOnce(), idleMs);
          },
        };

        const observer = new MutationObserver(() => handlers.scheduleIdle());
        observer.observe(document.body, { subtree: true, childList: true, attributes: true });

        const safetyTimer = setTimeout(() => handlers.resolveOnce(), timeoutMs);
        handlers.scheduleIdle();
      });
    }, this.options);
  }
}
