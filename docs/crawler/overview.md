> **Resumo**
> Este subarquivo concentra o núcleo de execução do crawler: criação da sessão Playwright, carregamento da página, captura de artefatos e HTML renderizado.
> É o ponto de leitura principal para a etapa inicial do pipeline antes do orquestrador e da infraestrutura de apoio.
> Código: `src/crawler/browser.ts`, `src/crawler/page-loader.ts`, `src/crawler/screenshot.ts`, `src/crawler/html-saver.ts`.

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

