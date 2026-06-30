import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateTimestamp } from '../../utils/time';

describe('generateTimestamp', () => {
  it('retorna uma string', () => {
    expect(typeof generateTimestamp()).toBe('string');
  });

  it('tem exatamente 19 caracteres', () => {
    expect(generateTimestamp()).toHaveLength(19);
  });

  it('segue o formato YYYY-MM-DD_HH-MM-SS', () => {
    const result = generateTimestamp();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
  });

  it('não contém "T" nem ":" da ISO original', () => {
    const result = generateTimestamp();
    expect(result).not.toContain('T');
    expect(result).not.toContain(':');
    expect(result).not.toContain('.');
  });

  it('usa data atual do sistema', () => {
    const before = new Date();
    const ts = generateTimestamp();
    const after = new Date();

    const year = ts.slice(0, 4);
    expect(Number(year)).toBeGreaterThanOrEqual(before.getFullYear());
    expect(Number(year)).toBeLessThanOrEqual(after.getFullYear());
  });

  it('retorna valores distintos em chamadas separadas com delay', async () => {
    const ts1 = generateTimestamp();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const ts2 = generateTimestamp();
    expect(ts1).not.toBe(ts2);
  });
});
