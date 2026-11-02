export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface BrowserFingerprintConfig {
  name: string;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  platform: string;
  locale: string;
  acceptLanguage: string;
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
  [key: string]: JsonValue;
}

export interface HumanizedDelayConfig {
  enabled: boolean;
  minMs: number;
  maxMs: number;
  [key: string]: JsonValue;
}

export interface ChallengeDetectionConfig {
  enabled: boolean;
  patterns: string[];
  [key: string]: JsonValue;
}

export interface BlockMetricsConfig {
  enabled: boolean;
  fileName: string;
  [key: string]: JsonValue;
}

export interface AntiBotConfig {
  enabled: boolean;
  stealth: boolean;
  rotateFingerprint: boolean;
  fingerprints: BrowserFingerprintConfig[];
  humanizedDelay: HumanizedDelayConfig;
  challengeDetection: ChallengeDetectionConfig;
  blockMetrics: BlockMetricsConfig;
  [key: string]: JsonValue;
}

export interface BrowserConfig {
  headless: boolean;
  slowMoMs: number;
  antiBot: AntiBotConfig;
  [key: string]: JsonValue;
}

export interface GlobalConfig {
  storage: {
    logsDir: string;
    outputDir: string;
    [key: string]: JsonValue;
  };
  browser: BrowserConfig;
  network: Record<string, JsonValue>;
  locale: Record<string, JsonValue>;
  logging: Record<string, JsonValue>;
  terminal: Record<string, JsonValue>;
  integrations: Record<string, JsonValue>;
  retry: {
    maxAttempts: number;
    backoffMs: number;
    [key: string]: JsonValue;
  };
  [key: string]: JsonValue;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends JsonArray
    ? JsonArray
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

export interface GlobalConfigService {
  read(): Promise<GlobalConfig>;
  write(config: DeepPartial<GlobalConfig>): Promise<GlobalConfig>;
}
