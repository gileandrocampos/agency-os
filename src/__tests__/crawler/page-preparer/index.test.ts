import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page } from 'playwright';
import { IdleWaiter } from '../../../crawler/page-preparer/idle-waiter';
import { CookieHandler } from '../../../crawler/page-preparer/cookie-handler';
import { OverlayHandler } from '../../../crawler/page-preparer/overlay-handler';
import { ScrollActivator } from '../../../crawler/page-preparer/scroll-activator';
import { PagePreparationService } from '../../../crawler/page-preparer/index';
import { DEFAULT_PREPARATION_CONFIG, type PreparationStep, type PreparationStepResult } from '../../../types/preparation';

vi.mock('../../../crawler/page-preparer/idle-waiter', () => ({
  IdleWaiter: vi.fn().mockImplementation(function () { return { name: 'idle-waiter', run: vi.fn() }; }),
}));

vi.mock('../../../crawler/page-preparer/cookie-handler', () => ({
  CookieHandler: vi.fn().mockImplementation(function () { return { name: 'cookie-handler', run: vi.fn() }; }),
}));

vi.mock('../../../crawler/page-preparer/overlay-handler', () => ({
  OverlayHandler: vi.fn().mockImplementation(function () { return { name: 'overlay-handler', run: vi.fn() }; }),
}));

vi.mock('../../../crawler/page-preparer/scroll-activator', () => ({
  ScrollActivator: vi.fn().mockImplementation(function () { return { name: 'scroll-activator', run: vi.fn() }; }),
}));

function makeStepMock(name: string, success = true): PreparationStep {
  const result: PreparationStepResult = { name, executed: true, success, durationMs: 1 };
  return { name, run: vi.fn().mockResolvedValue(result) };
}

describe('PagePreparationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (IdleWaiter as ReturnType<typeof vi.fn>).mockImplementation(function () { return { name: 'idle-waiter', run: vi.fn() }; });
    (CookieHandler as ReturnType<typeof vi.fn>).mockImplementation(function () { return { name: 'cookie-handler', run: vi.fn() }; });
    (OverlayHandler as ReturnType<typeof vi.fn>).mockImplementation(function () { return { name: 'overlay-handler', run: vi.fn() }; });
    (ScrollActivator as ReturnType<typeof vi.fn>).mockImplementation(function () { return { name: 'scroll-activator', run: vi.fn() }; });
  });

  it('instancia IdleWaiter duas vezes com a configuração padrão', () => {
    new PagePreparationService();
    expect(IdleWaiter).toHaveBeenCalledTimes(2);
  });

  it('passa networkIdleTimeout para IdleWaiter', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, networkIdleTimeout: 3000 });
    expect(IdleWaiter).toHaveBeenCalledWith(3000);
  });

  it('instancia CookieHandler quando cookieDismiss é true', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, cookieDismiss: true });
    expect(CookieHandler).toHaveBeenCalledOnce();
  });

  it('não instancia CookieHandler quando cookieDismiss é false', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, cookieDismiss: false });
    expect(CookieHandler).not.toHaveBeenCalled();
  });

  it('instancia OverlayHandler quando overlayDismiss é true', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, overlayDismiss: true });
    expect(OverlayHandler).toHaveBeenCalledOnce();
  });

  it('não instancia OverlayHandler quando overlayDismiss é false', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, overlayDismiss: false });
    expect(OverlayHandler).not.toHaveBeenCalled();
  });

  it('instancia ScrollActivator quando scrollActivation é true', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, scrollActivation: true });
    expect(ScrollActivator).toHaveBeenCalledOnce();
  });

  it('passa scrollDelay e maxScrollSteps para ScrollActivator', () => {
    const config = { ...DEFAULT_PREPARATION_CONFIG, scrollDelay: 500, maxScrollSteps: 10 };
    new PagePreparationService(config);
    expect(ScrollActivator).toHaveBeenCalledWith(500, 10);
  });

  it('não instancia ScrollActivator quando scrollActivation é false', () => {
    new PagePreparationService({ ...DEFAULT_PREPARATION_CONFIG, scrollActivation: false });
    expect(ScrollActivator).not.toHaveBeenCalled();
  });

  it('prepare chama run de todos os steps injetados', async () => {
    const stepA = makeStepMock('step-a');
    const stepB = makeStepMock('step-b');
    const service = new PagePreparationService(DEFAULT_PREPARATION_CONFIG, [stepA, stepB]);
    await service.prepare({} as Page);
    expect(stepA.run).toHaveBeenCalledOnce();
    expect(stepB.run).toHaveBeenCalledOnce();
  });

  it('prepare retorna success:true quando todos os steps têm sucesso', async () => {
    const service = new PagePreparationService(DEFAULT_PREPARATION_CONFIG, [
      makeStepMock('a'),
      makeStepMock('b'),
    ]);
    const result = await service.prepare({} as Page);
    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('prepare retorna success:false e popula warnings quando step falha', async () => {
    const service = new PagePreparationService(DEFAULT_PREPARATION_CONFIG, [
      makeStepMock('ok'),
      makeStepMock('fail', false),
    ]);
    const result = await service.prepare({} as Page);
    expect(result.success).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('fail');
  });

  it('prepare aceita steps via segundo parâmetro do constructor sem instanciar os padrão', () => {
    new PagePreparationService(DEFAULT_PREPARATION_CONFIG, [makeStepMock('custom')]);
    expect(IdleWaiter).not.toHaveBeenCalled();
  });
});
