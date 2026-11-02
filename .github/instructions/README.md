# Mapa de instruções do Agency OS

Este repositório usa duas camadas:

1. `.github/copilot-instructions.md` — regras universais do projeto.
2. `.github/instructions/*.instructions.md` — regras por fronteira de responsabilidade.

A seleção é feita pelo `applyTo` em cada arquivo e evita duplicar regras em módulos que não precisam delas.

| Arquivo | `applyTo` | Cobertura |
|---|---|---|
| `entrypoint.instructions.md` | `src/cli/**,src/application/**` | CLI e use cases |
| `crawler.instructions.md` | `src/crawler/**` | crawl, loader, browser e page-preparer |
| `extraction.instructions.md` | `src/parser/**,src/branding-extractor/**,src/contact-extractor/**` | parsing e extração |
| `output.instructions.md` | `src/manifest-builder/**,src/filesystem/**` | manifesto e persistência |
| `shared.instructions.md` | `src/config/**,src/logger/**,src/types/**,src/utils/**` | base compartilhada |
| `queue.instructions.md` | `src/queue/**` | fila persistente e processamento |
| `testing.instructions.md` | `src/__tests__/**` | testes e validações |

Para manutenção, vale a regra: regras globais no root; regras específicas por módulo ou fronteira no `.github/instructions/`.
Detalhes operacionais ficam em `docs/README.md` e nos documentos por módulo.
