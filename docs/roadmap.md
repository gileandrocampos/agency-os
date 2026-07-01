# Roadmap

## v0.1.0 — Núcleo de crawl (atual)

- [x] CLI com validação de URL
- [x] Sessão Playwright headless (Chromium)
- [x] Carregamento de página com `networkidle`
- [x] Pipeline de preparação de página (PagePreparer)
  - [x] IdleWaiter: rede, DOM, fontes, imagens
  - [x] CookieHandler: dispensa banners de cookie
  - [x] OverlayHandler: fecha modais e pop-ups
  - [x] ScrollActivator: ativa lazy load por scroll
- [x] Captura de screenshot fullpage (desktop 1280×720 + mobile 375×812)
- [x] Extração de HTML renderizado
- [x] Logger com timestamps (console + arquivo)
- [x] Script `safe-crawl` com gate de testes
- [x] Cobertura de testes ≥ 90%

---

## Próximas versões (planejado)

### v0.2.0 Parser
- [ ] Gerar site.json
- [ ] Extrair textos
- [ ] Contatos
- [ ] Menu
- [ ] Imagens
- [ ] Cores
- [ ] Fontes

### v0.3.0 — Auditoria técnica
- [ ] Análise de SEO (meta tags, headings, canonical, Open Graph)
- [ ] Auditoria de performance (recursos pesados, imagens sem dimensões)
- [ ] Relatório em JSON/HTML
- [ ] Lighthouse

### v0.4.0 — Geradores para criação da nova página.
- [ ] briefing.md
- [ ] wireframe.md
- [ ] design-system.md
- [ ] prompt.md

### v0.5.0 — Interface
- [ ] Dashboard com histórico
- [ ] Lista de análises
- [ ] Visualização das screenshots
- [ ] Download do pacote completo

### v1.0.0 - Assistente de Freelas
- [ ] Pipeline completa com um clique
- [ ] Templates de propostas comerciais
- [ ] Comparação Antes x Depois
