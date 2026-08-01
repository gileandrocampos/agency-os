import { ConfigSchemaNode } from './schema';
import { JsonArray, JsonObject, JsonValue } from './types';

export interface ConfigValidationIssue {
  path: string;
  message: string;
}

export function normalizeWithSchema(value: unknown, schema: ConfigSchemaNode): JsonValue {
  if (schema.type === 'object') {
    return normalizeObject(value, schema);
  }

  if (value === undefined) {
    return fallbackValue(schema);
  }

  if (schema.type === 'array') {
    return normalizeArray(value, schema);
  }

  return value as JsonValue;
}

export function validateWithSchema(
  value: unknown,
  schema: ConfigSchemaNode,
  currentPath = '$',
): ConfigValidationIssue[] {
  if (schema.type !== 'object') {
    return validateScalar(value, schema, currentPath);
  }

  if (!isPlainObject(value)) {
    return [{ path: currentPath, message: `esperado objeto, recebido ${describeType(value)}` }];
  }

  const issues: ConfigValidationIssue[] = [];
  const source = value as JsonObject;
  const properties = schema.properties ?? {};

  for (const [key, childSchema] of Object.entries(properties)) {
    const childPath = `${currentPath}.${key}`;
    const childValue = source[key];
    const childIssues = validateWithSchema(childValue, childSchema, childPath);
    issues.push(...childIssues);
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(source)) {
      if (properties[key] === undefined) {
        issues.push({ path: `${currentPath}.${key}`, message: 'chave não permitida' });
      }
    }
  }

  return issues;
}

function normalizeObject(value: unknown, schema: ConfigSchemaNode): JsonObject {
  const source = isPlainObject(value) ? (value as JsonObject) : {};
  const normalized: JsonObject = {};
  const properties = schema.properties ?? {};

  for (const [key, childSchema] of Object.entries(properties)) {
    normalized[key] = normalizeWithSchema(source[key], childSchema);
  }

  if (schema.additionalProperties !== false) {
    for (const [key, currentValue] of Object.entries(source)) {
      if (properties[key] === undefined && isJsonValue(currentValue)) {
        normalized[key] = currentValue;
      }
    }
  }

  return normalized;
}

function normalizeArray(value: unknown, schema: ConfigSchemaNode): JsonArray {
  if (!Array.isArray(value)) {
    return Array.isArray(schema.defaultValue) ? schema.defaultValue : [];
  }

  if (schema.items === undefined) {
    return value as JsonArray;
  }

  return value.map((item) => normalizeWithSchema(item, schema.items as ConfigSchemaNode));
}

function validateScalar(value: unknown, schema: ConfigSchemaNode, currentPath: string): ConfigValidationIssue[] {
  if (value === undefined) {
    return [];
  }

  if (schema.type === 'array') {
    return validateArray(value, schema, currentPath);
  }

  if (schema.type === 'null') {
    return value === null
      ? []
      : [{ path: currentPath, message: `esperado null, recebido ${describeType(value)}` }];
  }

  return typeof value === schema.type
    ? []
    : [{ path: currentPath, message: `esperado ${schema.type}, recebido ${describeType(value)}` }];
}

function validateArray(value: unknown, schema: ConfigSchemaNode, currentPath: string): ConfigValidationIssue[] {
  if (!Array.isArray(value)) {
    return [{ path: currentPath, message: `esperado array, recebido ${describeType(value)}` }];
  }

  if (schema.items === undefined) {
    return [];
  }

  const issues: ConfigValidationIssue[] = [];
  value.forEach((item, index) => {
    const itemIssues = validateWithSchema(item, schema.items as ConfigSchemaNode, `${currentPath}[${index}]`);
    issues.push(...itemIssues);
  });

  return issues;
}

function fallbackValue(schema: ConfigSchemaNode): JsonValue {
  if (schema.defaultValue !== undefined) {
    return schema.defaultValue;
  }

  if (schema.type === 'object') {
    return {};
  }

  if (schema.type === 'array') {
    return [];
  }

  if (schema.type === 'null') {
    return null;
  }

  if (schema.type === 'string') {
    return '';
  }

  if (schema.type === 'number') {
    return 0;
  }

  return false;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
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

function describeType(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  return typeof value;
}
