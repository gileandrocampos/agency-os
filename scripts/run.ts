import { spawn } from 'child_process';

function parseUrl(): string | null {
  return process.argv[2] ?? null;
}

function printLine(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runProcess(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => reject(err));
  });
}

async function runTests(): Promise<boolean> {
  printLine('🧪 Executando testes...');

  const exitCode = await runProcess('npx', ['vitest', 'run']);

  if (exitCode !== 0) {
    printLine('❌ Testes falharam. Abortando execução do crawler.');
    return false;
  }

  printLine('✔  Todos os testes passaram!');
  return true;
}

async function runCrawler(url: string): Promise<void> {
  printLine(`🚀 Iniciando crawler para: ${url}`);

  const exitCode = await runProcess('npx', ['tsx', 'src/cli/index.ts', url]);

  if (exitCode !== 0) {
    printLine('❌ Crawler encerrou com erro.');
    process.exit(exitCode);
  }

  printLine('✔  Crawler concluído com sucesso!');
}

async function main(): Promise<void> {
  const url = parseUrl();

  if (!url) {
    console.error('❌ URL não fornecida.');
    console.error('   Uso: npm run safe-crawl <url>');
    console.error('   Exemplo: npm run safe-crawl https://example.com');
    process.exit(1);
  }

  printLine('🚀 Iniciando fluxo seguro...');

  const testsPassed = await runTests();
  if (!testsPassed) {
    process.exit(1);
  }

  await runCrawler(url);
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err);
  process.exit(1);
});
