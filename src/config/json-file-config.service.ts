import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigSchemaNode, GLOBAL_CONFIG_SCHEMA } from './schema';
import { normalizeWithSchema, validateWithSchema } from './schema-processor';
import { DeepPartial, GlobalConfig, GlobalConfigService, JsonObject, JsonValue } from './types';

export class JsonFileConfigService implements GlobalConfigService {
  constructor(
    private readonly configFilePath = path.resolve('config.json'),
    private readonly schema: ConfigSchemaNode = GLOBAL_CONFIG_SCHEMA,
  ) {}

  async read(): Promise<GlobalConfig> {
    const rawConfig = await this.readOrCreateRawConfig();
    const normalized = normalizeWithSchema(rawConfig, this.schema);

    this.assertValidConfig(normalized);

    if (!this.areEquivalent(rawConfig, normalized)) {
      await this.persist(normalized as JsonObject);
    }

    return normalized as GlobalConfig;
  }

  async write(config: DeepPartial<GlobalConfig>): Promise<GlobalConfig> {
    const currentConfig = await this.read();
    const mergedConfig = deepMerge(currentConfig, config as JsonObject);
    const normalized = normalizeWithSchema(mergedConfig, this.schema);

    this.assertValidConfig(normalized);
    await this.persist(normalized as JsonObject);

    return normalized as GlobalConfig;
  }

  private assertValidConfig(config: JsonValue): void {
    const issues = validateWithSchema(config, this.schema);

    if (issues.length === 0) {
      return;
    }

    const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Configuração inválida: ${details}`);
  }

  private async readOrCreateRawConfig(): Promise<JsonObject> {
    try {
      const fileContent = await fs.readFile(this.configFilePath, 'utf-8');
      return JSON.parse(fileContent) as JsonObject;
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw this.toConfigReadError(error);
      }
    }

    const defaults = normalizeWithSchema(undefined, this.schema) as JsonObject;
    await this.persist(defaults);
    return defaults;
  }

  private async persist(config: JsonObject): Promise<void> {
    const dirPath = path.dirname(this.configFilePath);
    await fs.mkdir(dirPath, { recursive: true });

    const payload = `${JSON.stringify(config, null, 2)}\n`;
    await fs.writeFile(this.configFilePath, payload, 'utf-8');
  }

  private areEquivalent(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private toConfigReadError(error: unknown): Error {
    if (error instanceof SyntaxError) {
      return new Error(`Arquivo de configuração inválido: JSON malformado em ${this.configFilePath}`);
    }

    if (error instanceof Error) {
      return new Error(`Falha ao ler configuração em ${this.configFilePath}: ${error.message}`);
    }

    return new Error(`Falha ao ler configuração em ${this.configFilePath}`);
  }
}

function deepMerge(base: JsonObject, patch: JsonObject): JsonObject {
  const merged: JsonObject = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const currentValue = merged[key];

    if (isPlainObject(currentValue) && isPlainObject(value)) {
      merged[key] = deepMerge(currentValue, value);
      continue;
    }

    if (isJsonValue(value)) {
      merged[key] = value;
    }
  }

  return merged;
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isJsonValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).every((entry) => isJsonValue(entry));
  }

  return false;
}

function isPlainObject(value: unknown): value is JsonObject {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  return !Array.isArray(value);
}
