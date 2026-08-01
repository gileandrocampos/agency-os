import { describe, it, expect } from 'vitest';
import { selectSessionFingerprint } from '../../../crawler/anti-bot/fingerprint-rotator';

describe('selectSessionFingerprint', () => {
  const profiles = [
    {
      name: 'perfil-1',
      userAgent: 'UA-1',
      viewportWidth: 1280,
      viewportHeight: 720,
      platform: 'Windows',
      locale: 'pt-BR',
      acceptLanguage: 'pt-BR,pt;q=0.9',
      isMobile: false,
      hasTouch: false,
      deviceScaleFactor: 1,
    },
    {
      name: 'perfil-2',
      userAgent: 'UA-2',
      viewportWidth: 375,
      viewportHeight: 812,
      platform: 'iOS',
      locale: 'pt-BR',
      acceptLanguage: 'pt-BR,pt;q=0.9',
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    },
  ];

  it('retorna null quando anti-bot está desativado', () => {
    const result = selectSessionFingerprint({ enabled: false, rotate: true, profiles });
    expect(result).toBeNull();
  });

  it('retorna o primeiro perfil quando rotação está desativada', () => {
    const result = selectSessionFingerprint({ enabled: true, rotate: false, profiles });
    expect(result?.selectedProfile.name).toBe('perfil-1');
  });

  it('seleciona perfil com base no random quando rotação está ativa', () => {
    const result = selectSessionFingerprint({ enabled: true, rotate: true, profiles }, () => 0.99);
    expect(result?.selectedProfile.name).toBe('perfil-2');
  });
});
