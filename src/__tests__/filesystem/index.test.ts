import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ensureDir, buildSessionDir } from '../../filesystem';

vi.mock('fs');

describe('filesystem', () => {
  let mkdirSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mkdirSyncMock = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mkdirSyncMock.mockRestore();
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
});
