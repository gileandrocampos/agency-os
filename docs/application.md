# Application

> **Resumo**
> Este documento descreve a borda de entrada da aplicação.
> Escopo: `src/application/**` e `src/cli/**`.
> Os use cases atuais são finos e delegam para crawler/fila.
> A CLI usa `commander` e centraliza tratamento de erro por comando.

## Contratos

- `crawlSiteUseCase(input)` recebe `{ url: string }` e delega para `runCrawler(url)`.
- `enqueueSitesUseCase(input)` recebe `{ urls: string[] }` e enfileira cada URL via `enqueue`.
- `runQueueUseCase()` delega para `processQueue()`.
- `src/application/index.ts` reexporta os três use cases acima.
- `src/cli/index.ts` registra comandos `crawl` e `queue:*` no `Command` principal.
- `crawl` exige argumento `<url>`.
- `queue:add` aceita `<urls...>` com opções de prioridade e tentativas máximas.
- `queue:run`, `queue:list`, `queue:status <url>` e `queue:retry <url>` completam o contrato de fila na CLI.

## Fluxo

1. `src/cli/index.ts` instancia `Command`, registra subcomandos e executa `parseAsync(process.argv)`.
2. Cada ação da CLI chama um use case (`application`) ou uma função de `queue`.
3. Em `crawl` e `queue:run`, falhas são tratadas com `logError`, mensagem amigável (`printError`) e `process.exitCode = 1`.
4. Em `queue:add`, entradas são normalizadas (`parsePriority`, `parseMaxAttempts`) e o resultado consolidado em mensagem final.
5. Em `queue:list`/`queue:status`/`queue:retry`, o retorno é exibido via `printInfo`/`printSuccess`.

## Decisões de design

- Camada `application` mantém baixa complexidade: apenas orquestração e contratos de entrada.
- A validação de `max-attempts` acontece na borda CLI antes de tocar a fila.
- Prioridade inválida faz fallback para `normal` em vez de erro.
- A saída da CLI usa `printer.ts` para padronizar prefixos visuais (`❌`, `ℹ️`, `✔`).
- O comando de fila foi segmentado em subcomandos para operação incremental (`add`, `run`, `list`, `status`, `retry`).

## Casos de borda

- `queue:add --max-attempts` com valor não inteiro ou menor que 1 lança erro.
- `queue:status` para URL ausente retorna mensagem de não encontrado, sem exceção.
- `queue:retry` para URL fora de `failed` retorna mensagem sem alterar estado.
- `crawl` e `queue:run` não fazem `process.exit(1)` direto; apenas ajustam `process.exitCode`.
- `enqueueSitesUseCase` não deduplica internamente; duplicidade depende da camada `queue`.
