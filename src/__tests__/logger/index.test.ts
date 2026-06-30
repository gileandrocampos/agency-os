import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let appendFileSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appendFileSyncMock = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    appendFileSyncMock.mockRestore();
  });

  async function importLogger() {
    const mod = await import('../../logger/index');
    return mod;
  }

  it('logStart imprime mensagem com emoji 🚀', async () => {
    const { logStart } = await importLogger();
    logStart('teste');
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleLogSpy.mock.calls[0][0]).toContain('🚀 teste');
  });

  it('logUrl imprime mensagem com emoji 🌐', async () => {
    const { logUrl } = await importLogger();
    logUrl('https://example.com');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('🌐 https://example.com');
  });

  it('logDir imprime mensagem com emoji 📁', async () => {
    const { logDir } = await importLogger();
    logDir('/output/dir');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('📁 /output/dir');
  });

  it('logBrowser imprime mensagem com emoji 🕷️', async () => {
    const { logBrowser } = await importLogger();
    logBrowser('navegador');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('🕷️');
  });

  it('logPage imprime mensagem com emoji 🌐', async () => {
    const { logPage } = await importLogger();
    logPage('página');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('🌐 página');
  });

  it('logScreenshot imprime mensagem com emoji 📷', async () => {
    const { logScreenshot } = await importLogger();
    logScreenshot('captura');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('📷 captura');
  });

  it('logSave imprime mensagem com emoji 💾', async () => {
    const { logSave } = await importLogger();
    logSave('salvando');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('💾 salvando');
  });

  it('logSuccess imprime mensagem com emoji ✔', async () => {
    const { logSuccess } = await importLogger();
    logSuccess('concluído');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('✔ concluído');
  });

  it('logError imprime no console.error', async () => {
    const { logError } = await importLogger();
    logError('erro grave');
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('❌ erro grave');
  });

  it('logError registra stack trace quando error é instância de Error', async () => {
    const { initLogger, logError } = await importLogger();
    initLogger('/tmp/logs');
    const err = new Error('detalhe');
    logError('falhou', err);
    const calls = appendFileSyncMock.mock.calls;
    const hasStack = calls.some(([, content]) =>
      typeof content === 'string' && content.includes('STACK TRACE'),
    );
    expect(hasStack).toBe(true);
  });

  it('logError não falha quando error não é instância de Error', async () => {
    const { logError } = await importLogger();
    expect(() => logError('erro simples', 'string error')).not.toThrow();
  });

  it('initLogger define o caminho do arquivo de log', async () => {
    const { initLogger, logStart } = await importLogger();
    initLogger('/tmp/logs');
    logStart('com log em arquivo');
    expect(appendFileSyncMock).toHaveBeenCalled();
    const firstCall = appendFileSyncMock.mock.calls[0];
    expect(firstCall[0]).toContain('execution.log');
  });

  it('writeToFile não escreve quando logFilePath é null (antes de initLogger)', async () => {
    const { logStart } = await importLogger();
    logStart('sem arquivo');
    expect(appendFileSyncMock).not.toHaveBeenCalled();
  });

  it('a linha de log contém timestamp ISO formatado', async () => {
    const { logStart } = await importLogger();
    logStart('timestamp test');
    const line: string = consoleLogSpy.mock.calls[0][0];
    expect(line).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
