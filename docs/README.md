# Documentacao do projeto

## Camadas de instrucoes

- `.github/copilot-instructions.md`: regras universais do projeto.
- `.github/instructions/*.instructions.md`: regras por fronteira de responsabilidade via `applyTo`.
- `docs/`: detalhes operacionais e contratos por modulo.

## Indice

| modulo | caminho | resumo de 1 linha | quando ler |
|---|---|---|---|
| Templates | [docs/_templates/](./_templates/) | Checklists e modelos para criar doc e instruction de novo modulo. | Ao introduzir ou reorganizar modulo novo. |
| Application | [docs/application.md](./application.md) | Este documento descreve a borda de entrada da aplicacao e os use cases finos. | Ao alterar CLI, argumentos, validacao ou orquestracao de entrada. |
| Architecture | [docs/architecture.md](./architecture.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Para visao arquitetural transversal e relacoes entre camadas. |
| Branding Extractor | [docs/branding-extractor.md](./branding-extractor.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Ao ajustar extracao de identidade visual. |
| Contact Extractor | [docs/contact-extractor.md](./contact-extractor.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Ao ajustar extracao de contatos e formularios. |
| Core | [docs/core.md](./core.md) | Consolida modulos compartilhados estaveis e seus contratos publicos observados no codigo atual. | Ao alterar config, logger, types, utils ou filesystem. |
| Crawler (indice) | [docs/crawler/README.md](./crawler/README.md) | Orquestra a sessao de crawl e os artefatos de saida (`page.html`, screenshots, `site.json`). | Ponto de entrada para mudancas no pipeline de crawl. |
| Crawler Overview | [docs/crawler/overview.md](./crawler/overview.md) | Nucleo de execucao: sessao Playwright, carregamento, screenshot e HTML renderizado. | Ao mexer em `browser.ts`, `page-loader.ts`, `screenshot.ts` ou `html-saver.ts`. |
| Crawler Orchestration | [docs/crawler/orchestration.md](./crawler/orchestration.md) | Fluxo central do crawler, contrato de resultado e de `site.json`. | Ao mexer em `src/crawler/index.ts` e ordem do pipeline. |
| Crawler Supporting | [docs/crawler/supporting.md](./crawler/supporting.md) | Infraestrutura de apoio do crawler: filesystem, logs, validacao e contratos compartilhados. | Ao revisar caminhos de sessao, logs e tipos usados pelo pipeline. |
| Manifest Builder | [docs/manifest-builder.md](./manifest-builder.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Ao alterar montagem e persistencia do manifesto final. |
| Page Preparation (indice) | [docs/page-preparation/README.md](./page-preparation/README.md) | Prepara a pagina antes de captura/extracao com steps e configuracao tipada. | Ponto de entrada para mudancas no modulo de preparacao. |
| Page Preparation Overview | [docs/page-preparation/overview.md](./page-preparation/overview.md) | Contexto do modulo, problema que resolve e organizacao por arquivos. | Para entendimento inicial da preparacao antes dos contratos. |
| Page Preparation Contracts | [docs/page-preparation/contracts.md](./page-preparation/contracts.md) | Tipos compartilhados e orquestrador central da pipeline de preparacao. | Ao alterar `PreparationConfig`, `PreparationResult` ou ordem dos steps. |
| Page Preparation Steps | [docs/page-preparation/steps.md](./page-preparation/steps.md) | Steps principais em ordem de execucao para estabilizar a pagina. | Ao ajustar waits, cookies, overlay ou scroll. |
| Page Preparation Tasks | [docs/page-preparation/tasks.md](./page-preparation/tasks.md) | Tasks internas executadas via `page.evaluate()` para DOM, fontes e imagens. | Ao alterar utilitarios de browser-context. |
| Page Preparation Runtime | [docs/page-preparation/runtime.md](./page-preparation/runtime.md) | Fluxo completo, defaults, utilitario compartilhado e status de implementacao. | Para validar comportamento end-to-end da preparacao. |
| Parser | [docs/parser.md](./parser.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Ao alterar parse de HTML, metadata e extracao estrutural. |
| Product | [docs/product.md](./product.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Para contexto de produto e direcionamento funcional. |
| Queue (indice) | [docs/queue/README.md](./queue/README.md) | Fila persistente de jobs com retries e processamento sequencial de crawls. | Ponto de entrada para alteracoes da fila. |
| Queue Overview | [docs/queue/overview.md](./queue/overview.md) | Visao geral, interface publica e modelo de job da fila. | Para revisar contratos principais do modulo. |
| Queue API | [docs/queue/api.md](./queue/api.md) | Operacoes de CRUD e consumer com regras de retry/processamento. | Ao alterar API da fila ou logica de consumo. |
| Queue CLI | [docs/queue/cli.md](./queue/cli.md) | Comandos da fila via CLI e fluxo operacional de uso/retry. | Ao alterar comandos `queue:*` e operacao em terminal. |
| Queue Storage | [docs/queue/storage.md](./queue/storage.md) | Persistencia SQLite e schema de jobs. | Ao alterar armazenamento e reprocessamento da fila. |
| Roadmap | [docs/roadmap.md](./roadmap.md) | Sem bloco `> **Resumo**` neste arquivo (normalizar no Lote 4). | Para planejamento e priorizacao de evolucoes. |
| Testing | [docs/testing.md](./testing.md) | Praticas de teste do repositorio, escopo de suites e alvo de cobertura minima. | Ao escrever/ajustar testes e regras de cobertura. |
