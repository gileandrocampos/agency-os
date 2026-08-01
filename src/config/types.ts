export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface GlobalConfig {
  storage: {
    logsDir: string;
    outputDir: string;
    [key: string]: JsonValue;
  };
  browser: Record<string, JsonValue>;
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
