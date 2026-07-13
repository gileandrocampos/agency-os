# Módulos do Crawler

Documentação dos módulos que compõem o núcleo de execução do crawler, exceto o `page-preparer` (documentado em [page-preparation.md](page-preparation.md)).

---

## `browser.ts`

Arquivo: `src/crawler/browser.ts`

Cria e gerencia a sessão Playwright (browser + context + page). Encapsula o ciclo de vida do browser para que o orquestrador não precise conhecer os detalhes de `BrowserContext`.

### Interface `BrowserSession`

| Propriedade | Tipo                  | Descrição                              |
|-------------|-----------------------|----------------------------------------|
| `page`      | `Page`                | Página Playwright pronta para uso      |
| `close`     | `() => Promise<void>` | Fecha context e browser na ordem correta |

**Ordem de fechamento:** `context.close()` → `browser.close()`. O context deve fechar primeiro para garantir que todos os handlers de rede sejam encerrados antes do processo do browser.

### `createBrowserSession(): Promise<BrowserSession>`

Lança o Chromium em modo headless, cria um novo contexto e uma nova página. Retorna um `BrowserSession`.

---

## `page-loader.ts`

Arquivo: `src/crawler/page-loader.ts`

### `loadPage(page: Page, url: string): Promise<void>`

Navega para a URL usando `page.goto()` com:

| Opção        | Valor          | Motivo                                             |
|--------------|----------------|----------------------------------------------------|
| `waitUntil`  | `networkidle`  | Aguarda até que não haja requisições de rede ativas |
| `timeout`    | `30000` ms     | Evita travar indefinidamente em sites lentos        |

---

## `screenshot.ts`

Arquivo: `src/crawler/screenshot.ts`

### `captureScreenshot(page, viewport, outputDir): Promise<string>`

Define o tamanho da viewport e captura um screenshot fullpage. Retorna o caminho absoluto do arquivo gerado.

| Parâmetro   | Tipo             | Descrição                              |
|-------------|------------------|----------------------------------------|
| `page`      | `Page`           | Página Playwright                      |
| `viewport`  | `ViewportConfig` | Dimensões e nome (desktop / mobile)    |
| `outputDir` | `string`         | Diretório de saída da sessão           |

**Nome do arquivo:** `screenshot-{viewport.name}.png` (ex: `screenshot-desktop.png`).

**Viewports definidos em `src/types/index.ts`:**

| Constante          | Largura | Altura |
|--------------------|---------|--------|
| `DESKTOP_VIEWPORT` | 1280    | 720    |
| `MOBILE_VIEWPORT`  | 375     | 812    |

---

## `html-saver.ts`

Arquivo: `src/crawler/html-saver.ts`

### `saveHtml(page: Page, outputDir: string): Promise<string>`

Obtém o HTML renderizado via `page.content()` e grava em `{outputDir}/page.html`. Retorna o caminho do arquivo.

> `page.content()` retorna o HTML pós-execução de JavaScript, refletindo o estado real do DOM após toda a preparação.

---

## `index.ts` (orquestrador)

Arquivo: `src/crawler/index.ts`

Ponto central que combina todas as camadas em um fluxo coeso.

### `runCrawler(rawUrl: string): Promise<CrawlerResult>`

Função pública exportada. Executada pela CLI.

**Fluxo interno:**

```
1. buildConfig(rawUrl)       — valida URL, extrai domínio, gera timestamp, monta paths
2. setupSession(config)      — cria diretórios, inicializa logger
3. logStart / logUrl / logDir
4. executeCrawl(config)
     a. createBrowserSession()
     b. loadPage(session.page, config.url)
     c. PagePreparationService.prepare(page)
     d. captureScreenshot(desktop)
     e. captureScreenshot(mobile)
     f. saveHtml()
     g. extractMetadata()
     h. parseSite()
     i. buildSiteManifest()
     j. saveSiteManifest() → site.json
     k. session.close()  [sempre, via finally]
5. logSuccess
6. return CrawlerResult
```

### `CrawlerResult`

| Propriedade         | Tipo     | Descrição                          |
|---------------------|----------|------------------------------------|
| `url`               | `string` | URL crawleada (normalizada)        |
| `outputDir`         | `string` | Caminho da pasta de saída          |
| `screenshotDesktop` | `string` | Caminho do screenshot desktop      |
| `screenshotMobile`  | `string` | Caminho do screenshot mobile       |
| `htmlFile`          | `string` | Caminho do arquivo page.html       |
| `siteJsonFile`      | `string`        | Caminho do arquivo site.json       |
| `siteManifest`      | `SiteManifest`  | Manifesto consolidado do site       |

### `site.json`

Arquivo: `output/<domain>_<timestamp>/site.json`

Estrutura base:

```json
{
     "schemaVersion": "1.0.0",
     "source": { "url": "...", "domain": "...", "timestamp": "...", "outputDir": "...", "artifacts": {} },
     "content": { "language": null, "headings": [], "paragraphs": [], "links": [], "navigation": {}, "images": [] },
     "analysis": { "seo": { "metadata": {}, "audit": {} }, "ux": { "audit": {} }, "performance": { "audit": {} } },
     "generators": { "designSystem": {}, "wireframes": {} },
     "integrations": { "ai": {}, "googleMaps": {} },
     "platform": { "saas": {} }
}
```

O ManifestBuilder valida o contrato, consolida os dados sem duplicação e reserva espaços vazios para módulos futuros.

---

## `filesystem/index.ts`

Arquivo: `src/filesystem/index.ts`

Operações de sistema de arquivos usadas pelo orquestrador.

| Função                                               | Descrição                                             |
|------------------------------------------------------|-------------------------------------------------------|
| `ensureDir(dirPath)`                                 | Cria diretório recursivamente (não falha se existir)  |
| `buildSessionDir(outputBase, domain, timestamp)`     | Retorna `{outputBase}/{domain}_{timestamp}`           |

---

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

---

## `utils/url-validator.ts`

Arquivo: `src/utils/url-validator.ts`

| Função                        | Retorno   | Descrição                                              |
|-------------------------------|-----------|--------------------------------------------------------|
| `validateUrl(input: string)`  | `URL`     | Parseia e valida que o protocolo é `http` ou `https`   |
| `extractDomain(url: URL)`     | `string`  | Retorna `hostname` sem o prefixo `www.`                |

`validateUrl` lança `Error` com mensagem descritiva para:
- URL malformada (TypeError interno do `new URL()`)
- Protocolo diferente de `http:` ou `https:`

---

## `utils/time.ts`

Arquivo: `src/utils/time.ts`

| Função                  | Retorno   | Exemplo de saída      |
|-------------------------|-----------|-----------------------|
| `generateTimestamp()`   | `string`  | `2026-06-30_02-49-28` |

Formato: `YYYY-MM-DD_HH-mm-ss` (19 caracteres). Seguro para uso em nomes de diretório no Windows e Linux.

---

## `config.ts`

Arquivo: `src/config.ts`

Paths globais resolvidos em relação ao diretório de trabalho atual (`process.cwd()`).

| Constante    | Valor resolvido         |
|--------------|-------------------------|
| `LOGS_DIR`   | `{cwd}/logs`            |
| `OUTPUT_DIR` | `{cwd}/output`          |

---

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
