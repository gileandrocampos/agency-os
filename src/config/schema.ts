import * as path from 'path';
import { JsonValue } from './types';

export type ConfigSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface ConfigSchemaNode {
  type: ConfigSchemaType;
  defaultValue?: JsonValue;
  properties?: Record<string, ConfigSchemaNode>;
  items?: ConfigSchemaNode;
  additionalProperties?: boolean;
}

export const GLOBAL_CONFIG_SCHEMA: ConfigSchemaNode = {
  type: 'object',
  additionalProperties: true,
  properties: {
    storage: {
      type: 'object',
      additionalProperties: true,
      properties: {
        logsDir: { type: 'string', defaultValue: path.resolve('logs') },
        outputDir: { type: 'string', defaultValue: path.resolve('output') },
      },
    },
    browser: {
      type: 'object',
      additionalProperties: true,
      defaultValue: {},
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
