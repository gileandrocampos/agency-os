import { Page } from 'playwright';

export interface PreparationConfig {
  cookieDismiss: boolean;
  overlayDismiss: boolean;
  scrollActivation: boolean;
  scrollDelay: number;
  maxScrollSteps: number;
  networkIdleTimeout: number;
  waitForSelectors?: string[];
}

export const DEFAULT_PREPARATION_CONFIG: PreparationConfig = {
  cookieDismiss: true,
  overlayDismiss: true,
  scrollActivation: true,
  scrollDelay: 300,
  maxScrollSteps: 20,
  networkIdleTimeout: 5000,
};

export interface PreparationStepResult {
  name: string;
  executed: boolean;
  success: boolean;
  durationMs: number;
  detail?: string;
}

export interface PreparationResult {
  success: boolean;
  totalDurationMs: number;
  steps: PreparationStepResult[];
  warnings: string[];
}

export interface PreparationStep {
  readonly name: string;
  run(page: Page): Promise<PreparationStepResult>;
}
