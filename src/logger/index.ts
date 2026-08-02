import * as fs from 'fs';
import * as path from 'path';

const state: { logFilePath: string | null; silent: boolean } = {
  logFilePath: null,
  silent: false,
};

function currentTimestamp(): string {
  return new Date().toISOString();
}

function formatLine(message: string): string {
  return `[${currentTimestamp()}] ${message}`;
}

function writeToFile(line: string): void {
  if (!state.logFilePath) return;
  fs.appendFileSync(state.logFilePath, line + '\n', 'utf-8');
}

export function setSilent(value: boolean): void {
  state.silent = value;
}

function print(message: string): void {
  const line = formatLine(message);
  if (!state.silent) console.log(line);
  writeToFile(line); // sempre grava, silencioso ou não
}

export function initLogger(logsDir: string): void {
  state.logFilePath = path.join(logsDir, 'execution.log');
}

export function logStart(message: string): void {
  print(`🚀 ${message}`);
}

export function logUrl(message: string): void {
  print(`🌐 ${message}`);
}

export function logDir(message: string): void {
  print(`📁 ${message}`);
}

export function logBrowser(message: string): void {
  print(`🕷️  ${message}`);
}

export function logPage(message: string): void {
  print(`🌐 ${message}`);
}

export function logScreenshot(message: string): void {
  print(`📷 ${message}`);
}

export function logSave(message: string): void {
  print(`💾 ${message}`);
}

export function logSuccess(message: string): void {
  print(`✔ ${message}`);
}

export function logPrepare(message: string): void {
  print(`⚙️  ${message}`);
}

export function logRetry(message: string): void {
  print(`🔄 ${message}`);
}

export function logQueue(message: string): void {
  const line = formatLine(message);
  console.log(line);
  writeToFile(line);
}

export function logError(message: string, error?: unknown): void {
  const line = formatLine(`❌ ${message}`);
  if (!state.silent) console.error(line);
  writeToFile(line);

  if (error instanceof Error && error.stack) {
    writeToFile(`STACK TRACE:\n${error.stack}`);
  }
}
