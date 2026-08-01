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
import { ensureDir, buildSessionDir } from '../filesystem';
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

function buildConfig(rawUrl: string, globalConfig: GlobalConfig): CrawlerConfig {
  const url = validateUrl(rawUrl);
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

async function executeCrawl(
  config: CrawlerConfig,
  preparer: PagePreparationService = new PagePreparationService(),
): Promise<CrawlerResult> {
  logBrowser('Abrindo navegador');
  const session = await createBrowserSession();

  try {
    logPage(`Carregando página: ${config.url}`);
    await loadPage(session.page, config.url);

    logPrepare('Preparando página');
    const prepResult = await preparer.prepare(session.page);
    prepResult.warnings.forEach((w) => logError(`Aviso preparação: ${w}`));
    logSuccess(`Página preparada em ${prepResult.totalDurationMs}ms`);

    logScreenshot('Capturando Desktop');
    const desktopPath = await captureScreenshot(session.page, DESKTOP_VIEWPORT, config.outputDir);

    logScreenshot('Capturando Mobile');
    const mobilePath = await captureScreenshot(session.page, MOBILE_VIEWPORT, config.outputDir);

    const html = await session.page.content();

    logSave('Salvando HTML');
    const htmlPath = await saveHtml(html, config.outputDir);

    const branding = await extractBranding(session.page);

    const metadata = extractMetadata(html);
    const parsedSite = parseSite(html, config.url);
    const contacts = extractContacts({ html, baseUrl: config.url });
    const siteManifest = buildSiteManifest({
      url: config.url,
      domain: config.domain,
      timestamp: config.timestamp,
      outputDir: config.outputDir,
      htmlFile: htmlPath,
      screenshotDesktop: desktopPath,
      screenshotMobile: mobilePath,
      parsedSite,
      metadata,
      branding,
      contacts,
    });

    const siteJsonFile = await saveSiteManifest(siteManifest, config.outputDir);

    return {
      url: config.url,
      outputDir: config.outputDir,
      screenshotDesktop: desktopPath,
      screenshotMobile: mobilePath,
      htmlFile: htmlPath,
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
): Promise<CrawlerResult> {
  const globalConfig = await configService.read();
  const config = buildConfig(rawUrl, globalConfig);

  setupSession(config);

  logStart('Iniciando análise');
  logUrl(`Validando URL: ${rawUrl}`);
  logDir('Criando diretórios');

  const retryOptions = {
    maxAttempts: globalConfig.retry.maxAttempts,
    backoffMs: globalConfig.retry.backoffMs,
  };

  const result = await withRetry(() => executeCrawl(config), retryOptions);

  logSuccess('Processo concluído');

  return result;
}
