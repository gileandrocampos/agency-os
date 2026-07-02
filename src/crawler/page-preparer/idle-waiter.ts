import { Page } from 'playwright';
import { PreparationStep, PreparationStepResult } from '../../types/preparation';
import { WaitDomTask } from './tasks/wait-dom';
import { WaitFontsTask } from './tasks/wait-fonts';
import { WaitImagesTask } from './tasks/wait-images';

export class IdleWaiter implements PreparationStep {
  readonly name = 'idle-waiter';

  private readonly domTask: WaitDomTask;
  private readonly fontsTask: WaitFontsTask;
  private readonly imagesTask: WaitImagesTask;

  constructor(
    private readonly networkIdleTimeout: number,
    domTask?: WaitDomTask,
    fontsTask?: WaitFontsTask,
    imagesTask?: WaitImagesTask,
  ) {
    this.domTask = domTask ?? new WaitDomTask({ idleMs: 500, timeoutMs: networkIdleTimeout });
    this.fontsTask = fontsTask ?? new WaitFontsTask({ timeoutMs: networkIdleTimeout });
    this.imagesTask = imagesTask ?? new WaitImagesTask({ timeoutMs: networkIdleTimeout });
  }

  async run(page: Page): Promise<PreparationStepResult> {
    const start = Date.now();
    try {
      await page.waitForLoadState('networkidle', { timeout: this.networkIdleTimeout }).catch(() => {});
      await this.domTask.run(page);
      await this.fontsTask.run(page);
      await this.imagesTask.run(page);
      return { name: this.name, executed: true, success: true, durationMs: Date.now() - start };
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
