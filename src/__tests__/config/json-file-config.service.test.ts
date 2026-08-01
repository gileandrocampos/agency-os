import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JsonFileConfigService } from '../../config';

describe('JsonFileConfigService', () => {
  let tempDir: string;
  let configFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agency-os-config-'));
    configFilePath = path.join(tempDir, 'config.json');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('cria arquivo com defaults quando configuração não existe', async () => {
    const service = new JsonFileConfigService(configFilePath);

    const config = await service.read();

    expect(config.storage.logsDir).toBe('logs');
    expect(config.storage.outputDir).toBe('output');
    const persisted = JSON.parse(await fs.readFile(configFilePath, 'utf-8')) as { storage?: { logsDir?: string } };
    expect(persisted.storage?.logsDir).toBe('logs');
  });

  it('aplica defaults para campos ausentes ao carregar', async () => {
    await fs.writeFile(configFilePath, JSON.stringify({ storage: { logsDir: '/custom-logs' } }), 'utf-8');
    const service = new JsonFileConfigService(configFilePath);

    const config = await service.read();

    expect(config.storage.logsDir).toBe('/custom-logs');
    expect(config.storage.outputDir).toBe('output');
  });

  it('preserva chaves extras para futuras configurações', async () => {
    await fs.writeFile(
      configFilePath,
      JSON.stringify({
        storage: { logsDir: '/logs', outputDir: '/output' },
        browser: { headless: true },
        integrations: { openai: { key: 'abc' } },
      }),
      'utf-8',
    );
    const service = new JsonFileConfigService(configFilePath);

    const config = await service.read();

    expect(config.browser.headless).toBe(true);
    expect(config.integrations.openai).toMatchObject({ key: 'abc' });
  });

  it('lança erro quando o arquivo possui JSON inválido', async () => {
    await fs.writeFile(configFilePath, '{invalid-json', 'utf-8');
    const service = new JsonFileConfigService(configFilePath);

    await expect(service.read()).rejects.toThrow(/JSON malformado/);
  });

  it('faz merge de escrita parcial mantendo estrutura válida', async () => {
    const service = new JsonFileConfigService(configFilePath);

    const saved = await service.write({
      storage: {
        logsDir: '/novo-logs',
      },
      browser: {
        headless: true,
      },
    });

    expect(saved.storage.logsDir).toBe('/novo-logs');
    expect(saved.storage.outputDir).toBe('output');
    expect(saved.browser.headless).toBe(true);
  });

  it('lança erro quando tipo no schema é inválido', async () => {
    await fs.writeFile(
      configFilePath,
      JSON.stringify({ storage: { logsDir: 123, outputDir: '/output' } }),
      'utf-8',
    );
    const service = new JsonFileConfigService(configFilePath);

    await expect(service.read()).rejects.toThrow(/Configuração inválida/);
  });
});
