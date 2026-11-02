export interface BrowserFingerprintProfile {
  name: string;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  platform: string;
  locale: string;
  acceptLanguage: string;
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
}

export interface FingerprintRotationConfig {
  enabled: boolean;
  rotate: boolean;
  profiles: BrowserFingerprintProfile[];
}

export interface SessionFingerprint {
  selectedProfile: BrowserFingerprintProfile;
  userAgent: string;
  locale: string;
  viewport: {
    width: number;
    height: number;
  };
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
  extraHeaders: Record<string, string>;
}

export function selectSessionFingerprint(
  config: FingerprintRotationConfig,
  random: () => number = Math.random,
): SessionFingerprint | null {
  if (!config.enabled || config.profiles.length === 0) {
    return null;
  }

  const profile = config.rotate
    ? config.profiles[Math.floor(random() * config.profiles.length)]
    : config.profiles[0];

  return {
    selectedProfile: profile,
    userAgent: profile.userAgent,
    locale: profile.locale,
    viewport: {
      width: profile.viewportWidth,
      height: profile.viewportHeight,
    },
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    deviceScaleFactor: profile.deviceScaleFactor,
    extraHeaders: {
      'Accept-Language': profile.acceptLanguage,
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Sec-CH-UA-Platform': `"${profile.platform}"`,
    },
  };
}
