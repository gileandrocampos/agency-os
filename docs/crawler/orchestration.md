> **Resumo**
> Este arquivo documenta o fluxo central do crawler, incluindo a função pública de execução, a estrutura do resultado e o contrato do `site.json`.
> É o ponto de leitura para entender a ordem de execução e os artefatos gerados pela sessão.
> Código: `src/crawler/index.ts`; artefatos em `output/<domain>_<timestamp>/`.

## `index.ts` (orquestrador)

Arquivo: `src/crawler/index.ts`

Ponto central que combina todas as camadas em um fluxo coeso.

### `runCrawler(rawUrl: string): Promise<CrawlerResult | null>`

Função pública exportada. Executada pela CLI.

**Fluxo interno:**

```
1. buildConfig(rawUrl)       — valida URL, extrai domínio, gera timestamp, monta paths
2. setupSession(config)      — cria diretórios, inicializa logger
3. logStart / logUrl / logDir
4. executeCrawl(config)
     a. createBrowserSession()
     b. loadPage(session.page, config.url)
     c. detectChallenge(session.page)
        - se detectar, registra métricas de bloqueio e encerra com `null`
     d. PagePreparationService.prepare(page)
     e. captureScreenshot(desktop)
     f. captureScreenshot(mobile)
     g. saveHtml()
     h. extractMetadata()
     i. parseSite()
     j. buildSiteManifest()
     k. saveSiteManifest() → site.json
     l. session.close()  [sempre, via finally]
5. logSuccess
6. return CrawlerResult (ou `null` se challenge for detectado)
```

### Fluxo Anti-Bot

Configuração em `config.json` (`browser.antiBot`):

- `enabled`: ativa a camada anti-bot
- `stealth`: controla a aplicação de fingerprint
- `rotateFingerprint`: seleciona um fingerprint por sessão
- `fingerprints`: perfis de navegador com user agent, viewport, plataforma e locale
- `humanizedDelay`: intervalo aleatório antes da navegação e de ações de preparação
- `challengeDetection`: padrões usados para identificar bloqueios ou CAPTCHA
- `blockMetrics`: persistência de tentativas e bloqueios por domínio

As métricas por domínio são persistidas em `logs/block-metrics.json` (ou no arquivo configurado), com tentativas, bloqueios, timestamps e tipo do challenge.

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
