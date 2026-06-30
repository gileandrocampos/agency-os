import { runCrawler } from '../crawler';
import { logError } from '../logger';

function parseCliArgs(argv: string[]): string | null {
  return argv[2] ?? null;
}

async function main(): Promise<void> {
  const rawUrl = parseCliArgs(process.argv);

  if (!rawUrl) {
    console.error('❌ URL não fornecida.');
    console.error('   Uso: npm run crawl <url>');
    console.error('   Exemplo: npm run crawl https://example.com');
    process.exit(1);
  }

  try {
    await runCrawler(rawUrl);
  } catch (error) {
    logError('Falha na execução do crawler', error);
    process.exit(1);
  }
}

main();
