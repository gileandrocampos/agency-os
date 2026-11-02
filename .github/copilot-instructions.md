# Agency OS - Copilot Instructions

## Projeto
Agency OS e um crawler local em TypeScript que recebe uma URL, renderiza com Playwright, extrai dados estruturados e salva `site.json` + screenshots em `output/<domain>_<timestamp>/`.
Este arquivo define regras universais; regras por modulo ficam em `.github/instructions/*.instructions.md`.

## Stack
Node.js · TypeScript estrito · Playwright · Vitest · tsx (esbuild)

## Comandos
- `npm run crawl <url>`
- `npm run queue -- queue:<sub>`
- `npm run safe-queue`
- `npm test`
- `npm run test:coverage`

## Convenções globais
- Nunca usar `console.log` fora de `src/logger/`; logs passam pelo `Logger`.
- Shared (`src/config/**`, `src/logger/**`, `src/types/**`, `src/utils/**`) pode ser importado por qualquer camada.
- Nao ha importacao direta entre modulos nao-shared; a orquestracao fica no nivel de aplicacao.
- Shared nao importa de crawler, parser, extractors, manifest-builder, filesystem ou queue.
- Codigo: ingles; logs e mensagens para usuario: portugues; testes em portugues.
- `strict` ativo; sem `any` explicito; sem default export; imports Node.js com namespace.
- Funcoes stateless; max 40 linhas; params obrigatorios antes dos opcionais.
- Bordas do sistema e tasks internas devem lancar `Error` com contexto.

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

## Regras de contexto
- Trabalhe um módulo por vez; use o mapa abaixo para achar a instruction e o doc.
- Leia primeiro o bloco "Resumo" do doc; abra o doc inteiro ou subarquivos só se o resumo não bastar.
- Nunca leia `docs/` inteiro nem varra o repositório; prefira anexos `#file` e busca dirigida.
- Não releia arquivos já lidos na conversa.

## Manutenção de docs
- Ao mudar comportamento ou contrato de um módulo, atualize o doc dele no mesmo commit.
- Novo módulo em `src/`: siga `docs/_templates/NEW_MODULE.md` (doc, instruction com `applyTo`, linha no mapa e em `docs/README.md`).
