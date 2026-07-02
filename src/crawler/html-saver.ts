import * as fs from 'fs';
import * as path from 'path';

export async function saveHtml(html: string, outputDir: string): Promise<string> {
  const filePath = path.join(outputDir, 'page.html');

  fs.writeFileSync(filePath, html, 'utf-8');

  return filePath;
}
