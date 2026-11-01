> **Resumo**
> Este módulo orquestra a sessão de crawl do site, valida a URL, cria a pasta de saída e produz os artefatos de renderização e análise.
> Entradas: URL do site e configurações globais do processo.
> Saídas: screenshots, `page.html`, `site.json` e logs em `output/<domain>_<timestamp>/`.
> Dependências: `src/crawler/**`, `src/config.ts`, `src/filesystem/**`, `src/logger/**`, `src/utils/**`, `src/types/**`.
> Código: `src/crawler/**`, `src/filesystem/**`, `src/logger/**`, `src/config.ts`, `src/types/**`, `src/utils/**`.

# Crawler

## Índice

| Arquivo | O que contém | Quando ler |
|----------|--------------|------------|
| [overview.md](./overview.md) | Sessão Playwright, carregamento, screenshot e HTML renderizado | Para entender a preparação imediata da página e a captura de artefatos |
| [orchestration.md](./orchestration.md) | Orquestração do fluxo principal, `CrawlerResult` e contrato de `site.json` | Para entender a execução completa e o resultado final |
| [supporting.md](./supporting.md) | Filesystem, logger, validadores, config e tipos compartilhados | Para verificar a infraestrutura de sessão e os contratos da aplicação |
