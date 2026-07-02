# Arquitetura

## Visão geral do fluxo

```
CLI (src/cli/index.ts)
  └─ parseCliArgs → rawUrl
       ↓
Crawler (src/crawler/index.ts) — runCrawler()
  ├─ Utils: validateUrl + extractDomain (url-validator.ts)
  ├─ Utils: generateTimestamp (time.ts)
  ├─ FileSystem: ensureDir + buildSessionDir (filesystem/index.ts)
  ├─ Logger: initLogger (logger/index.ts)
  ├─ Browser: createBrowserSession (browser.ts)
  ├─ PageLoader: loadPage (page-loader.ts)
  ├─ PagePreparer: PagePreparationService.prepare() (page-preparer/index.ts)
  │    ├─ IdleWaiter      → networkidle + DOM + fonts + images
  │    ├─ CookieHandler   → clica botão de aceitar cookie
  │    ├─ OverlayHandler  → fecha modais e pop-ups
  │    ├─ ScrollActivator → scroll para ativar lazy load
  │    └─ IdleWaiter      → aguarda efeitos colaterais das interações
  ├─ Screenshot: captureScreenshot ×2 (desktop + mobile)
  └─ HtmlSaver: saveHtml → page.html
       ↓
Output (output/<domain>_<timestamp>/)
  ├─ screenshot-desktop.png
  ├─ screenshot-mobile.png
  └─ page.html

Logs (logs/execution.log)
```

---

## Camadas e responsabilidades

| Camada            | Localização                        | Responsabilidade                                                  |
|-------------------|------------------------------------|-------------------------------------------------------------------|
| **CLI**           | `src/cli/index.ts`                 | Ponto de entrada: parseia args e delega ao Crawler                |
| **Crawler**       | `src/crawler/index.ts`             | Orquestra o fluxo completo de uma sessão de crawl                 |
| **Browser**       | `src/crawler/browser.ts`           | Cria e fecha sessão Playwright (browser + context + page)         |
| **PageLoader**    | `src/crawler/page-loader.ts`       | Navega para a URL e aguarda `networkidle`                         |
| **PagePreparer**  | `src/crawler/page-preparer/`       | Pipeline de preparação da página antes da captura                 |
| **Screenshot**    | `src/crawler/screenshot.ts`        | Captura screenshot fullpage por viewport                          |
| **HtmlSaver**     | `src/crawler/html-saver.ts`        | Salva o HTML renderizado em disco                                 || **Parser**       | `src/parser/index.ts`              | Extrai dados estruturados do HTML renderizado (título, headings, links, etc.) || **FileSystem**    | `src/filesystem/index.ts`          | Cria diretórios e constrói caminhos de sessão                     |
| **Logger**        | `src/logger/index.ts`              | Logs prefixados com timestamp no console e em arquivo             |
| **Utils**         | `src/utils/`                       | Funções puras: validação de URL, extração de domínio, timestamp   |
| **Types**         | `src/types/`                       | Interfaces e constantes compartilhadas entre camadas              |
| **Config**        | `src/config.ts`                    | Paths globais resolvidos (`LOGS_DIR`, `OUTPUT_DIR`)               |

---

## Scripts

| Script             | Comando                          | Descrição                                              |
|--------------------|----------------------------------|--------------------------------------------------------|
| `npm run crawl`    | `tsx src/cli/index.ts <url>`     | Executa o crawler diretamente                          |
| `npm run safe-crawl`| `tsx scripts/run.ts <url>`      | Roda testes primeiro; aborta se algum falhar           |
| `npm run test`     | `vitest run`                     | Executa a suite de testes                              |
| `npm run test:coverage` | `vitest run --coverage`    | Executa testes com relatório de cobertura              |

---

## Tipos compartilhados

Ver `src/types/index.ts` e `src/types/preparation.ts`. Documentação completa em [page-preparation.md](page-preparation.md).