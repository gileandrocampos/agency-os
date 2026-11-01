> **Resumo**
> Este arquivo reúne os módulos de infraestrutura que sustentam a sessão do crawler: arquivos, logs, validação de URL, configuração global e contratos compartilhados.
> Use esta leitura para confirmar os caminhos, os eventos de execução e os tipos de dados que o pipeline usa.
> Código de referência: `src/filesystem/**`, `src/logger/**`, `src/utils/**`, `src/config.ts`, `src/types/**`.

## `filesystem/index.ts`

Arquivo: `src/filesystem/index.ts`

Operações de sistema de arquivos usadas pelo orquestrador.

| Função                                               | Descrição                                             |
|------------------------------------------------------|-------------------------------------------------------|
| `ensureDir(dirPath)`                                 | Cria diretório recursivamente (não falha se existir)  |
| `buildSessionDir(outputBase, domain, timestamp)`     | Retorna `{outputBase}/{domain}_{timestamp}`           |

## `logger/index.ts`

Arquivo: `src/logger/index.ts`

Logger stateful com escrita em console e em arquivo. Estado interno: `logFilePath` (nulo até `initLogger` ser chamado).

| Função              | Prefixo | Descrição                                          |
|---------------------|---------|----------------------------------------------------|
| `initLogger(dir)`   | —       | Define o arquivo de log como `{dir}/execution.log` |
| `logStart(msg)`     | 🚀      | Início de processo                                 |
| `logUrl(msg)`       | 🌐      | Validação / acesso a URL                           |
| `logDir(msg)`       | 📁      | Operação de diretório                              |
| `logBrowser(msg)`   | 🕷️      | Operação de browser                               |
| `logPage(msg)`      | 🌐      | Carregamento de página                             |
| `logPrepare(msg)`   | ⚙️      | Etapa de preparação                               |
| `logScreenshot(msg)`| 📷      | Captura de screenshot                              |
| `logSave(msg)`      | 💾      | Salvamento de arquivo                              |
| `logSuccess(msg)`   | ✔       | Conclusão bem-sucedida                             |
| `logError(msg, err)`| ❌      | Erro (vai para `console.error` + arquivo)          |

Cada linha gravada inclui timestamp ISO 8601: `[2026-06-30T12:00:00.000Z] mensagem`.

Se `initLogger` não for chamado, as mensagens ainda aparecem no console mas não são escritas em arquivo.

## `utils/url-validator.ts`

Arquivo: `src/utils/url-validator.ts`

| Função                        | Retorno   | Descrição                                              |
|-------------------------------|-----------|--------------------------------------------------------|
| `validateUrl(input: string)`  | `URL`     | Parseia e valida que o protocolo é `http` ou `https`   |
| `extractDomain(url: URL)`     | `string`  | Retorna `hostname` sem o prefixo `www.`                |

`validateUrl` lança `Error` com mensagem descritiva para:
- URL malformada (TypeError interno do `new URL()`)
- Protocolo diferente de `http:` ou `https:`

## `utils/time.ts`

Arquivo: `src/utils/time.ts`

| Função                  | Retorno   | Exemplo de saída      |
|-------------------------|-----------|-----------------------|
| `generateTimestamp()`   | `string`  | `2026-06-30_02-49-28` |

Formato: `YYYY-MM-DD_HH-mm-ss` (19 caracteres). Seguro para uso em nomes de diretório no Windows e Linux.

## `config.ts`

Arquivo: `src/config.ts`

Paths globais resolvidos em relação ao diretório de trabalho atual (`process.cwd()`).

| Constante    | Valor resolvido         |
|--------------|-------------------------|
| `LOGS_DIR`   | `{cwd}/logs`            |
| `OUTPUT_DIR` | `{cwd}/output`          |

## `types/index.ts`

Arquivo: `src/types/index.ts`

Tipos e constantes compartilhados entre as camadas do crawler (exceto os tipos de preparação, que ficam em `types/preparation.ts`).

| Símbolo              | Tipo        | Descrição                                       |
|----------------------|-------------|-------------------------------------------------|
| `CrawlerConfig`      | `interface` | Configuração de uma sessão de crawl             |
| `CrawlerResult`      | `interface` | Resultado retornado por `runCrawler()`          |
| `ViewportConfig`     | `interface` | Dimensões e nome de um viewport                 |
| `DESKTOP_VIEWPORT`   | `const`     | 1280×720, name: `'desktop'`                     |
| `MOBILE_VIEWPORT`    | `const`     | 375×812, name: `'mobile'`                       |
