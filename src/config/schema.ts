import { JsonValue } from './types';

export type ConfigSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface ConfigSchemaNode {
  type: ConfigSchemaType;
  defaultValue?: JsonValue;
  properties?: Record<string, ConfigSchemaNode>;
  items?: ConfigSchemaNode;
  additionalProperties?: boolean;
}

const DEFAULT_FINGERPRINTS: JsonValue[] = [
  {
    name: 'chrome-win11-desktop',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewportWidth: 1366,
    viewportHeight: 768,
    platform: 'Windows',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  },
  {
    name: 'chrome-macos-desktop',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewportWidth: 1440,
    viewportHeight: 900,
    platform: 'macOS',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 2,
  },
  {
    name: 'chrome-linux-desktop',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    viewportWidth: 1536,
    viewportHeight: 864,
    platform: 'Linux',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  },
  {
    name: 'safari-iphone15',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    viewportWidth: 393,
    viewportHeight: 852,
    platform: 'iOS',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  {
    name: 'chrome-android-pixel7',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
    viewportWidth: 412,
    viewportHeight: 915,
    platform: 'Android',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.625,
  },
  {
    name: 'chrome-win10-wide',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewportWidth: 1920,
    viewportHeight: 1080,
    platform: 'Windows',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  },
];

const DEFAULT_CHALLENGE_PATTERNS: JsonValue[] = [
  'cloudflare',
  'datadome',
  'just a moment',
  'attention required',
  'verify you are human',
  'captcha',
];

export const GLOBAL_CONFIG_SCHEMA: ConfigSchemaNode = {
  type: 'object',
  additionalProperties: true,
  properties: {
    storage: {
      type: 'object',
      additionalProperties: true,
      properties: {
        logsDir: { type: 'string', defaultValue: 'logs' },
        outputDir: { type: 'string', defaultValue: 'output' },
      },
    },
    browser: {
      type: 'object',
      additionalProperties: true,
      properties: {
        headless: { type: 'boolean', defaultValue: false },
        slowMoMs: { type: 'number', defaultValue: 500 },
        antiBot: {
          type: 'object',
          additionalProperties: true,
          properties: {
            enabled: { type: 'boolean', defaultValue: true },
            stealth: { type: 'boolean', defaultValue: true },
            rotateFingerprint: { type: 'boolean', defaultValue: true },
            fingerprints: {
              type: 'array',
              defaultValue: DEFAULT_FINGERPRINTS,
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  name: { type: 'string' },
                  userAgent: { type: 'string' },
                  viewportWidth: { type: 'number' },
                  viewportHeight: { type: 'number' },
                  platform: { type: 'string' },
                  locale: { type: 'string' },
                  acceptLanguage: { type: 'string' },
                  isMobile: { type: 'boolean' },
                  hasTouch: { type: 'boolean' },
                  deviceScaleFactor: { type: 'number' },
                },
              },
            },
            humanizedDelay: {
              type: 'object',
              additionalProperties: true,
              properties: {
                enabled: { type: 'boolean', defaultValue: true },
                minMs: { type: 'number', defaultValue: 300 },
                maxMs: { type: 'number', defaultValue: 1200 },
              },
            },
            challengeDetection: {
              type: 'object',
              additionalProperties: true,
              properties: {
                enabled: { type: 'boolean', defaultValue: true },
                patterns: {
                  type: 'array',
                  defaultValue: DEFAULT_CHALLENGE_PATTERNS,
                  items: { type: 'string' },
                },
              },
            },
            blockMetrics: {
              type: 'object',
              additionalProperties: true,
              properties: {
                enabled: { type: 'boolean', defaultValue: true },
                fileName: { type: 'string', defaultValue: 'block-metrics.json' },
              },
            },
          },
        },
      },
    },
    network: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
    },
    locale: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
    },
    logging: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
    },
    terminal: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
    },
    integrations: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
    },
    retry: {
      type: 'object',
      additionalProperties: true,
      properties: {
        maxAttempts: { type: 'number', defaultValue: 3 },
        backoffMs: { type: 'number', defaultValue: 1000 },
      },
    },
  },
};
