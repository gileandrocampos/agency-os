import * as fs from 'fs';
import * as path from 'path';
import { logError, logSave, logSuccess } from '../logger';
import type { SiteManifest } from './types';

export const SITE_MANIFEST_FILE_NAME = 'site.json';

function ensureOutputDir(outputDir: string): string {
  const normalized = outputDir.trim();

  if (!normalized) {
    throw new Error('O diretório de saída é obrigatório para salvar o site.json.');
  }

  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
    throw new Error('O diretório de saída informado não existe ou não é um diretório válido.');
  }

  return normalized;
}

export class SiteManifestWriter {
  async save(manifest: SiteManifest, outputDir: string): Promise<string> {
    logSave('Salvando site.json');

    try {
      const filePath = path.join(ensureOutputDir(outputDir), SITE_MANIFEST_FILE_NAME);
      fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), 'utf-8');
      logSuccess('site.json salvo com sucesso');
      return filePath;
    } catch (error) {
      logError('Falha ao salvar o site.json', error);
      throw error instanceof Error ? error : new Error('Falha ao salvar o site.json');
    }
  }
}

export async function saveSiteManifest(manifest: SiteManifest, outputDir: string): Promise<string> {
  const writer = new SiteManifestWriter();
  return writer.save(manifest, outputDir);
}