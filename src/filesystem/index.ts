import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function buildSessionDir(outputBase: string, domain: string, timestamp: string): string {
  return path.join(outputBase, `${domain}_${timestamp}`);
}
