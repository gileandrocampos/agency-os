# Agency OS - Copilot Instructions

## Projeto
Agency OS e um crawler local em TypeScript que recebe uma URL, renderiza com Playwright, extrai dados estruturados e salva `site.json` + screenshots em `output/<domain>_<timestamp>/`.
Stack: Node.js, TypeScript estrito, Playwright, Vitest, tsx.
Este arquivo define regras universais; regras por modulo ficam em `.github/instructions/*.instructions.md`.

## Mapa de módulos
| Módulo | caminho | instrução | doc |
|---|---|---|---|
| CLI + Application | `src/cli/**`, `src/application/**` | `.github/instructions/entrypoint.instructions.md` | `docs/application.md` |
| Crawler | `src/crawler/**` | `.github/instructions/crawler.instructions.md` | `docs/crawler/README.md` |
| Page Preparation | `src/crawler/page-preparer/**` | `.github/instructions/crawler.instructions.md` | `docs/page-preparation/README.md` |
| Parser | `src/parser/**` | `.github/instructions/extraction.instructions.md` | `docs/parser.md` |
| Branding Extractor | `src/branding-extractor/**` | `.github/instructions/extraction.instructions.md` | `docs/branding-extractor.md` |
| Contact Extractor | `src/contact-extractor/**` | `.github/instructions/extraction.instructions.md` | `docs/contact-extractor.md` |
| Manifest Builder | `src/manifest-builder/**` | `.github/instructions/output.instructions.md` | `docs/manifest-builder.md` |
| Filesystem | `src/filesystem/**` | `.github/instructions/output.instructions.md` | `docs/core.md` |
| Config | `src/config/**` | `.github/instructions/shared.instructions.md` | `docs/core.md` |
| Logger | `src/logger/**` | `.github/instructions/shared.instructions.md` | `docs/core.md` |
| Types | `src/types/**` | `.github/instructions/shared.instructions.md` | `docs/core.md` |
| Utils | `src/utils/**` | `.github/instructions/shared.instructions.md` | `docs/core.md` |
| Queue | `src/queue/**` | `.github/instructions/queue.instructions.md` | `docs/queue/README.md` |
| Testes | `src/__tests__/**` | `.github/instructions/testing.instructions.md` | `docs/testing.md` |

## Invariantes Arquiteturais
- Nunca usar `console.log` fora de `src/logger/`; logs passam pelo `Logger`.
- Shared (`src/config/**`, `src/logger/**`, `src/types/**`, `src/utils/**`) pode ser importado por qualquer camada.
- Não há importação direta entre módulos não-shared; a orquestração fica no nível de aplicação.
- Shared não importa de crawler, parser, extractors, manifest-builder, filesystem ou queue.
- Codigo: ingles; logs e mensagens para usuário: portugues; testes em portugues.
- `strict` ativo; sem `any` explicito; sem default export; imports Node.js com namespace.
- Funções stateless; max 40 linhas; params obrigatórios antes dos opcionais.
- Bordas do sistema e tasks internas devem lançar `Error` com contexto.

## Scripts e DoD
- Comandos oficiais: `npm run crawl <url>`, `npm run queue -- queue:<sub>`, `npm run safe-queue`, `npm test`, `npm run test:coverage`.
- Fluxo: Nova ideia -> Branch -> Implementar -> Testes -> Documentacao -> Safe-Queue -> PR -> Merge.
- Toda `feat`, `fix` e `refactor` exige happy path, bordas e erros.
- Definition of Done: implementacao finalizada, testes passando, cobertura >= 90%, `safe-queue` aprovado, logs/erros/documentacao/CHANGELOG atualizados.
