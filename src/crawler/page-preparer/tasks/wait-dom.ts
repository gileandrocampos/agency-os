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

        const resolveOnce = () => {
          if (settled) return;
          settled = true;
          observer.disconnect();
          clearTimeout(safetyTimer);
          clearTimeout(idleTimer);
          resolve();
        };

        // Replaces the pending idle timer with a fresh one on each DOM mutation.
        const scheduleIdle = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(resolveOnce, idleMs);
        };

        const observer = new MutationObserver(scheduleIdle);
        observer.observe(document.body, { subtree: true, childList: true, attributes: true });

        const safetyTimer = setTimeout(resolveOnce, timeoutMs);
        scheduleIdle();
      });
    }, this.options);
  }
}
