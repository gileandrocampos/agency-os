import type { Page } from 'playwright';
import { CrawlerConfig, CrawlerResult, DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from '../types';
import {
  initLogger,
  logStart,
  logUrl,
  logDir,
  logBrowser,
  logPage,
  logPrepare,
  logScreenshot,
  logSave,
  logSuccess,
  logError,
} from '../logger';
import { validateUrl, extractDomain } from '../utils/url-validator';
import { generateTimestamp } from '../utils/time';
import { ensureDir, buildSessionDir, recordDomainAttempt, recordDomainBlock } from '../filesystem';
import { GlobalConfig, GlobalConfigService, JsonFileConfigService } from '../config';
import { createBrowserSession } from './browser';
import { loadPage } from './page-loader';
import { captureScreenshot } from './screenshot';
import { saveHtml } from './html-saver';
import { PagePreparationService } from './page-preparer';
import { withRetry } from './retry';
import { extractMetadata, parseSite } from '../parser';
import { extractBranding } from '../branding-extractor';
import { extractContacts } from '../contact-extractor';
import { buildSiteManifest, saveSiteManifest } from '../manifest-builder';
import { detectChallenge } from './anti-bot/challenge-detector';
import { createHumanizedDelay } from './anti-bot/humanized-delay';
import { BrowserFingerprintProfile } from './anti-bot/fingerprint-rotator';

interface AntiBotRuntimeConfig {
  enabled: boolean;
  rotateFingerprint: boolean;
  fingerprints: BrowserFingerprintProfile[];
  humanizedDelay: {
    enabled: boolean;
    minMs: number;
    maxMs: number;
  };
  challengeDetection: {
    enabled: boolean;
    patterns: string[];
  };
  blockMetrics: {
    enabled: boolean;
    fileName: string;
  };
}

interface CrawlerExecutionOptions {
  headless: boolean;
  slowMoMs: number;
  antiBot: AntiBotRuntimeConfig;
}

interface SessionArtifacts {
  desktopPath: string;
  mobilePath: string;
  htmlPath: string;
  html: string;
}

function buildConfig(url: URL, globalConfig: GlobalConfig): CrawlerConfig {
  const domain = extractDomain(url);
  const timestamp = generateTimestamp();
  const outputDir = buildSessionDir(globalConfig.storage.outputDir, domain, timestamp);

  return {
    url: url.toString(),
    domain,
    timestamp,
    outputDir,
    logsDir: globalConfig.storage.logsDir,
  };
}

function setupSession(config: CrawlerConfig): void {
  ensureDir(config.logsDir);
  initLogger(config.logsDir);
  ensureDir(config.outputDir);
}

async function openSession(executionOptions: CrawlerExecutionOptions) {
  logBrowser('Abrindo navegador');
  return createBrowserSession({
    headless: executionOptions.headless,
    slowMoMs: executionOptions.slowMoMs,
    antiBot: {
      enabled: executionOptions.antiBot.enabled,
      rotateFingerprint: executionOptions.antiBot.rotateFingerprint,
      fingerprints: executionOptions.antiBot.fingerprints,
    },
  });
}

async function maybeDetectChallenge(
  page: Page,
  config: CrawlerConfig,
  executionOptions: CrawlerExecutionOptions,
): Promise<boolean> {
  const challenge = await detectChallenge(page, executionOptions.antiBot.challengeDetection);
  if (challenge === null) {
    return false;
  }
  const detail = `Bloqueio anti-bot detectado em ${config.domain} (${config.timestamp}) - tipo: ${challenge.type}; padrão: ${challenge.matchedPattern}; origem: ${challenge.source}`;
  logError(detail);
  if (executionOptions.antiBot.blockMetrics.enabled) {
    safeRecordDomainBlock(config, challenge.type, executionOptions);
  }
  return true;
}

async function captureArtifacts(page: Page, config: CrawlerConfig): Promise<SessionArtifacts> {
  logScreenshot('Capturando Desktop');
  const desktopPath = await captureScreenshot(page, DESKTOP_VIEWPORT, config.outputDir);
  logScreenshot('Capturando Mobile');
  const mobilePath = await captureScreenshot(page, MOBILE_VIEWPORT, config.outputDir);
  const html = await page.content();
  logSave('Salvando HTML');
  const htmlPath = await saveHtml(html, config.outputDir);
  return { desktopPath, mobilePath, htmlPath, html };
}

async function buildAndPersistManifest(page: Page, config: CrawlerConfig, artifacts: SessionArtifacts) {
  const branding = await extractBranding(page);
  const metadata = extractMetadata(artifacts.html);
  const parsedSite = parseSite(artifacts.html, config.url);
  const contacts = extractContacts({ html: artifacts.html, baseUrl: config.url });
  const siteManifest = buildSiteManifest({
    url: config.url,
    domain: config.domain,
    timestamp: config.timestamp,
    outputDir: config.outputDir,
    htmlFile: artifacts.htmlPath,
    screenshotDesktop: artifacts.desktopPath,
    screenshotMobile: artifacts.mobilePath,
    parsedSite,
    metadata,
    branding,
    contacts,
  });
  const siteJsonFile = await saveSiteManifest(siteManifest, config.outputDir);
  return { siteManifest, siteJsonFile, parsedSite, branding, contacts };
}

async function executeCrawl(
  config: CrawlerConfig,
  executionOptions: CrawlerExecutionOptions,
): Promise<CrawlerResult | null> {
  if (executionOptions.antiBot.blockMetrics.enabled) {
    safeRecordDomainAttempt(config, executionOptions);
  }

  const delayBeforeAction = createHumanizedDelay(executionOptions.antiBot.humanizedDelay);
  const preparer = new PagePreparationService(undefined, undefined, delayBeforeAction);
  const session = await openSession(executionOptions);

  try {
    logPage(`Carregando página: ${config.url}`);
    await loadPage(session.page, config.url, delayBeforeAction);

    const isBlocked = await maybeDetectChallenge(session.page, config, executionOptions);
    if (isBlocked) {
      return null;
    }

    logPrepare('Preparando página');
    const prepResult = await preparer.prepare(session.page);
    prepResult.warnings.forEach((w) => logError(`Aviso preparação: ${w}`));
    logSuccess(`Página preparada em ${prepResult.totalDurationMs}ms`);

    const artifacts = await captureArtifacts(session.page, config);
    const { siteManifest, siteJsonFile, parsedSite, branding, contacts } = await buildAndPersistManifest(session.page, config, artifacts);

    return {
      url: config.url,
      outputDir: config.outputDir,
      screenshotDesktop: artifacts.desktopPath,
      screenshotMobile: artifacts.mobilePath,
      htmlFile: artifacts.htmlPath,
      siteJsonFile,
      siteManifest,
      parsedSite,
      branding,
      contacts,
    };
  } finally {
    await session.close();
  }
}

export async function runCrawler(
  rawUrl: string,
  configService: GlobalConfigService = new JsonFileConfigService(),
): Promise<CrawlerResult | null> {
  const url = validateUrl(rawUrl);
  const globalConfig = await configService.read();
  const config = buildConfig(url, globalConfig);
  const executionOptions = buildExecutionOptions(globalConfig);

  setupSession(config);

  logStart('Iniciando análise');
  logUrl(`Validando URL: ${rawUrl}`);
  logDir('Criando diretórios');

  const retryOptions = {
    maxAttempts: globalConfig.retry.maxAttempts,
    backoffMs: globalConfig.retry.backoffMs,
  };

  const result = await withRetry(() => executeCrawl(config, executionOptions), retryOptions);

  if (result === null) {
    logSuccess('Processo concluído sem extração: domínio bloqueado por challenge');
    return null;
  }

  logSuccess('Processo concluído');

  return result;
}

function buildExecutionOptions(globalConfig: GlobalConfig): CrawlerExecutionOptions {
  const antiBot = globalConfig.browser.antiBot;
  const isEnabled = antiBot.enabled;
  const stealthEnabled = antiBot.stealth;
  const fingerprints = antiBot.fingerprints;

  return {
    headless: globalConfig.browser.headless,
    slowMoMs: globalConfig.browser.slowMoMs,
    antiBot: {
      enabled: isEnabled && stealthEnabled,
      rotateFingerprint: antiBot.rotateFingerprint,
      fingerprints: mapFingerprints(fingerprints),
      humanizedDelay: {
        enabled: antiBot.humanizedDelay.enabled && isEnabled,
        minMs: antiBot.humanizedDelay.minMs,
        maxMs: antiBot.humanizedDelay.maxMs,
      },
      challengeDetection: {
        enabled: antiBot.challengeDetection.enabled && isEnabled,
        patterns: antiBot.challengeDetection.patterns,
      },
      blockMetrics: {
        enabled: antiBot.blockMetrics.enabled && isEnabled,
        fileName: antiBot.blockMetrics.fileName,
      },
    },
  };
}

function mapFingerprints(
  profiles: ReadonlyArray<{
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
  }>,
): BrowserFingerprintProfile[] {
  return profiles.map((profile) => ({
    name: profile.name,
    userAgent: profile.userAgent,
    viewportWidth: profile.viewportWidth,
    viewportHeight: profile.viewportHeight,
    platform: profile.platform,
    locale: profile.locale,
    acceptLanguage: profile.acceptLanguage,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    deviceScaleFactor: profile.deviceScaleFactor,
  }));
}

function safeRecordDomainAttempt(
  config: CrawlerConfig,
  executionOptions: CrawlerExecutionOptions,
): void {
  try {
    recordDomainAttempt(config.logsDir, config.domain, config.timestamp, executionOptions.antiBot.blockMetrics.fileName);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logError(`Aviso métrica anti-bot (attempt): ${detail}`);
  }
}

function safeRecordDomainBlock(
  config: CrawlerConfig,
  challengeType: string,
  executionOptions: CrawlerExecutionOptions,
): void {
  try {
    recordDomainBlock(
      config.logsDir,
      config.domain,
      config.timestamp,
      challengeType,
      executionOptions.antiBot.blockMetrics.fileName,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logError(`Aviso métrica anti-bot (block): ${detail}`);
  }
}
