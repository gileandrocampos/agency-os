import { Page } from 'playwright';
import {
  PreparationConfig,
  PreparationResult,
  PreparationStep,
  PreparationStepResult,
  DEFAULT_PREPARATION_CONFIG,
} from '../../types/preparation';
import { IdleWaiter } from './idle-waiter';
import { CookieHandler } from './cookie-handler';
import { OverlayHandler } from './overlay-handler';
import { ScrollActivator } from './scroll-activator';

export class PagePreparationService {
  private readonly steps: PreparationStep[];

  constructor(
    config: PreparationConfig = DEFAULT_PREPARATION_CONFIG,
    steps?: PreparationStep[],
  ) {
    this.steps = steps ?? this.buildSteps(config);
  }

  async prepare(page: Page): Promise<PreparationResult> {
    const start = Date.now();
    const stepResults: PreparationStepResult[] = [];
    const warnings: string[] = [];

    for (const step of this.steps) {
      const result = await step.run(page);
      stepResults.push(result);
      if (!result.success) {
        warnings.push(`${result.name}: ${result.detail ?? 'unknown error'}`);
      }
    }

    return {
      success: stepResults.every((r) => r.success),
      totalDurationMs: Date.now() - start,
      steps: stepResults,
      warnings,
    };
  }

  private buildSteps(config: PreparationConfig): PreparationStep[] {
    const steps: PreparationStep[] = [];

    steps.push(new IdleWaiter(config.networkIdleTimeout));

    if (config.cookieDismiss) {
      steps.push(new CookieHandler());
    }

    if (config.overlayDismiss) {
      steps.push(new OverlayHandler());
    }

    if (config.scrollActivation) {
      steps.push(new ScrollActivator(config.scrollDelay, config.maxScrollSteps));
    }

    steps.push(new IdleWaiter(config.networkIdleTimeout));

    return steps;
  }
}
