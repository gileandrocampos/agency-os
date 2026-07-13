# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.2.0] — Em progresso

### Added
- `ManifestBuilder`: consolidação de `parseSite()` + `extractMetadata()` em um `site.json` validado e extensível
- `SiteParser`: extração de title, description, language, headings, paragraphs, links e images via cheerio
- `MetadataExtractor`: extração de metadados do `<head>` (title, description, keywords, author, viewport, charset, robots, canonical, Open Graph, Twitter Card)
- `Navigation Extractor`: extração de menu principal, links de footer e classificação de links internos/externos em formato serializável

---

## [0.1.0] — 2026-06-29

### Added
- CLI com validação de URL
- Sessão Playwright headless (Chromium)
- Carregamento de página com `networkidle`
- Pipeline de preparação de página (`PagePreparer`):
  - `IdleWaiter`: aguarda rede, DOM, fontes e imagens
  - `CookieHandler`: dispensa banners de cookie
  - `OverlayHandler`: fecha modais e pop-ups
  - `ScrollActivator`: ativa lazy load por scroll
- Captura de screenshot fullpage (desktop 1280×720 + mobile 375×812)
- Extração de HTML renderizado (`page.html`)
- Logger com timestamps (console + arquivo)
- Script `safe-crawl` com gate de testes
- Cobertura de testes ≥ 90%
