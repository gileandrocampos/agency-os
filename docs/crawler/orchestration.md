> **Resumo**
> Este arquivo documenta o fluxo central do crawler, incluindo a função pública de execução, a estrutura do resultado e o contrato do `site.json`.
> É o ponto de leitura para entender a ordem de execução e os artefatos gerados pela sessão.
> Código: `src/crawler/index.ts`; artefatos em `output/<domain>_<timestamp>/`.

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
