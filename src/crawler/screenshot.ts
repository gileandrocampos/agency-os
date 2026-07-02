import { Page } from 'playwright';
import * as path from 'path';
import { ViewportConfig } from '../types';

export async function captureScreenshot(
  page: Page,
  viewport: ViewportConfig,
  outputDir: string,
): Promise<string> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  const filePath = path.join(outputDir, `screenshot-${viewport.name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });

  return filePath;
}
