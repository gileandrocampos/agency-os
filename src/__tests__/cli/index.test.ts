import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../crawler', () => ({
  runCrawler: vi.fn(),
}));

vi.mock('../../logger', () => ({
  logError: vi.fn(),
}));

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('CLI index', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let originalArgv: string[];

  beforeEach(() => {
    vi.resetModules();
    originalArgv = [...process.argv];
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.argv = originalArgv;
    exitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('chama process.exit(1) quando URL não é fornecida', async () => {
    process.argv = ['node', 'script'];
    await import('../../cli/index');
    await flushPromises();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('chama runCrawler com a URL fornecida', async () => {
    const { runCrawler } = await import('../../crawler');
    (runCrawler as ReturnType<typeof vi.fn>).mockResolvedValue({});

    process.argv = ['node', 'script', 'https://example.com'];
    await import('../../cli/index');
    await flushPromises();

    expect(runCrawler).toHaveBeenCalledWith('https://example.com');
  });

  it('chama logError e process.exit(1) quando runCrawler lança erro', async () => {
    const { runCrawler } = await import('../../crawler');
    const { logError } = await import('../../logger');
    const err = new Error('falha no crawl');
    (runCrawler as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    process.argv = ['node', 'script', 'https://example.com'];
    await import('../../cli/index');
    await flushPromises();

    expect(logError).toHaveBeenCalledWith('Falha na execução do crawler', err);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
