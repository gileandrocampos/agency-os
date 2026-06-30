import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export async function saveHtml(page: Page, outputDir: string): Promise<string> {
  const html = await page.content();
  const filePath = path.join(outputDir, 'page.html');

  fs.writeFileSync(filePath, html, 'utf-8');

  return filePath;
}
