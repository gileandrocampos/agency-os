export interface HumanizedDelayConfig {
  enabled: boolean;
  minMs: number;
  maxMs: number;
}

export type SleepFn = (ms: number) => Promise<void>;

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHumanizedDelay(
  config: HumanizedDelayConfig,
  random: () => number = Math.random,
  sleep: SleepFn = defaultSleep,
): () => Promise<number> {
  return async () => {
    if (!config.enabled) {
      return 0;
    }

    const min = Math.max(0, Math.floor(config.minMs));
    const max = Math.max(min, Math.floor(config.maxMs));
    const selectedDelay = min + Math.floor(random() * (max - min + 1));

    await sleep(selectedDelay);

    return selectedDelay;
  };
}
