import type { Page } from 'playwright';

export interface ChallengeDetectionConfig {
  enabled: boolean;
  patterns: string[];
}

export interface ChallengeDetectionResult {
  type: string;
  matchedPattern: string;
  source: 'title' | 'url' | 'html';
}

interface PageSignals {
  title: string;
  url: string;
  html: string;
}

const SOURCE_PRIORITY: Array<ChallengeDetectionResult['source']> = ['title', 'url', 'html'];
const GENERIC_CHALLENGE_MARKERS = [
  'cf-chl-',
  'cf_turnstile',
  'cf-turnstile',
  'challenge-platform',
  'why_captcha',
  'captcha-delivery.com',
  'geo.captcha-delivery.com',
  '/cdn-cgi/',
  'datadome',
  'ddv=',
  'ddoriginalreferrer',
  '/captcha/',
];
const CAPTCHA_BLOCK_MARKERS = [
  'cdn-cgi/challenge-platform',
  'cf-chl-',
  'cf-turnstile',
  'datadome',
  'captcha-delivery.com',
  'geo.captcha-delivery.com',
  'why_captcha',
];

export async function detectChallenge(
  page: Page,
  config: ChallengeDetectionConfig,
): Promise<ChallengeDetectionResult | null> {
  if (!config.enabled || config.patterns.length === 0) {
    return null;
  }

  const normalizedPatterns = config.patterns.map((pattern) => pattern.toLowerCase());
  const [title, url, html] = await Promise.all([
    page.title().catch(() => ''),
    Promise.resolve(page.url()).catch(() => ''),
    page.content().catch(() => ''),
  ]);

  const signals: PageSignals = {
    title: title.toLowerCase(),
    url: url.toLowerCase(),
    html: html.toLowerCase(),
  };

  for (const source of SOURCE_PRIORITY) {
    const content = signals[source];
    for (const pattern of normalizedPatterns) {
      if (!content.includes(pattern)) {
        continue;
      }

      const challengeType = classifyChallengeType(pattern);
      if (!isValidBlockingMatch(challengeType, pattern, source, signals)) {
        continue;
      }

      return {
        type: challengeType,
        matchedPattern: pattern,
        source,
      };
    }
  }

  return null;
}

function isValidBlockingMatch(
  challengeType: string,
  pattern: string,
  source: ChallengeDetectionResult['source'],
  signals: PageSignals,
): boolean {
  if (!isPotentiallyNoisySource(source, challengeType)) {
    return true;
  }

  if (isCaptchaPattern(pattern)) {
    return CAPTCHA_BLOCK_MARKERS.some((marker) => signals.html.includes(marker));
  }

  return hasGenericChallengeEvidence(signals);
}

function isPotentiallyNoisySource(source: ChallengeDetectionResult['source'], challengeType: string): boolean {
  if (source !== 'html') {
    return false;
  }

  return challengeType === 'captcha' || challengeType === 'cloudflare' || challengeType === 'datadome';
}

function hasGenericChallengeEvidence(signals: PageSignals): boolean {
  const mergedSignals = `${signals.title} ${signals.url} ${signals.html}`;
  return GENERIC_CHALLENGE_MARKERS.some((marker) => mergedSignals.includes(marker));
}

function isCaptchaPattern(pattern: string): boolean {
  return pattern.includes('captcha');
}

function classifyChallengeType(pattern: string): string {
  if (pattern.includes('cloudflare') || pattern.includes('just a moment') || pattern.includes('attention required')) {
    return 'cloudflare';
  }

  if (pattern.includes('datadome')) {
    return 'datadome';
  }

  if (pattern.includes('captcha') || pattern.includes('human')) {
    return 'captcha';
  }

  return 'challenge';
}
