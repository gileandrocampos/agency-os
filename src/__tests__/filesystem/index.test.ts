import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ensureDir, buildSessionDir, recordDomainAttempt, recordDomainBlock } from '../../filesystem';

vi.mock('fs');

describe('filesystem', () => {
  let mkdirSyncMock: ReturnType<typeof vi.spyOn>;
  let existsSyncMock: ReturnType<typeof vi.spyOn>;
  let readFileSyncMock: ReturnType<typeof vi.spyOn>;
  let writeFileSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mkdirSyncMock = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    existsSyncMock = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    readFileSyncMock = vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    writeFileSyncMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mkdirSyncMock.mockRestore();
    existsSyncMock.mockRestore();
    readFileSyncMock.mockRestore();
    writeFileSyncMock.mockRestore();
  });

  describe('ensureDir', () => {
    it('chama fs.mkdirSync com recursive: true', () => {
      ensureDir('/some/dir');
      expect(mkdirSyncMock).toHaveBeenCalledWith('/some/dir', { recursive: true });
    });

    it('chama fs.mkdirSync uma vez por chamada', () => {
      ensureDir('/a');
      ensureDir('/b');
      expect(mkdirSyncMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('buildSessionDir', () => {
    it('combina outputBase, domain e timestamp corretamente', () => {
      const result = buildSessionDir('/output', 'example.com', '2026-01-01_00-00-00');
      expect(result).toBe(path.join('/output', 'example.com_2026-01-01_00-00-00'));
    });

    it('retorna string não vazia', () => {
      const result = buildSessionDir('/base', 'site.com', '2026-06-29_12-00-00');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('inclui o domain no caminho gerado', () => {
      const result = buildSessionDir('/out', 'meusite.com.br', '2026-06-01_10-00-00');
      expect(result).toContain('meusite.com.br');
    });

    it('inclui o timestamp no caminho gerado', () => {
      const result = buildSessionDir('/out', 'site.com', '2026-06-01_10-00-00');
      expect(result).toContain('2026-06-01_10-00-00');
    });
  });

  describe('recordDomainAttempt', () => {
    it('incrementa tentativas do domínio e persiste em JSON', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(JSON.stringify({
        'example.com': {
          attempts: 2,
          blocked: 1,
          lastAttemptAt: '2026-08-01_10-00-00',
        },
      }));

      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00', 'metrics.json');

      expect(writeFileSyncMock).toHaveBeenCalledOnce();
      const writtenJson = String(writeFileSyncMock.mock.calls[0][1]);
      expect(writtenJson).toContain('"attempts": 3');
      expect(writtenJson).toContain('"lastAttemptAt": "2026-08-01_11-00-00"');
    });

    it('sanitiza fileName inválido para evitar path traversal', () => {
      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00', '../outside.json');

      expect(existsSyncMock).toHaveBeenCalledWith(path.join('/logs', 'outside.json'));
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join('/logs', 'outside.json'),
        expect.any(String),
        'utf-8',
      );
    });

    it('usa fallback seguro quando fileName contém caracteres inválidos', () => {
      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00', 'metrics?.json');

      expect(existsSyncMock).toHaveBeenCalledWith(path.join('/logs', 'block-metrics.json'));
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join('/logs', 'block-metrics.json'),
        expect.any(String),
        'utf-8',
      );
    });
  });

  describe('recordDomainBlock', () => {
    it('incrementa bloqueios e registra tipo do challenge', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(JSON.stringify({
        'example.com': {
          attempts: 5,
          blocked: 1,
          lastAttemptAt: '2026-08-01_11-00-00',
        },
      }));

      recordDomainBlock('/logs', 'example.com', '2026-08-01_11-05-00', 'cloudflare', 'metrics.json');

      expect(writeFileSyncMock).toHaveBeenCalledOnce();
      const writtenJson = String(writeFileSyncMock.mock.calls[0][1]);
      expect(writtenJson).toContain('"blocked": 2');
      expect(writtenJson).toContain('"lastChallengeType": "cloudflare"');
    });
  });

  describe('readDomainMetrics (via recordDomainAttempt)', () => {
    it('trata JSON com número como store vazio e inicia nova entrada', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue('42');

      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00');

      const writtenJson = String(writeFileSyncMock.mock.calls[0][1]);
      expect(writtenJson).toContain('"attempts": 1');
    });

    it('trata JSON com array como store vazio e inicia nova entrada', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue('[]');

      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00');

      const writtenJson = String(writeFileSyncMock.mock.calls[0][1]);
      expect(writtenJson).toContain('"attempts": 1');
    });

    it('trata JSON com null como store vazio e inicia nova entrada', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue('null');

      recordDomainAttempt('/logs', 'example.com', '2026-08-01_11-00-00');

      const writtenJson = String(writeFileSyncMock.mock.calls[0][1]);
      expect(writtenJson).toContain('"attempts": 1');
    });
  });
});
