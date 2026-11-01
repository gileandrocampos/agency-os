# Agency OS - Copilot Instructions

## Projeto
Agency OS e um crawler local em TypeScript que recebe uma URL, renderiza com Playwright, extrai dados estruturados e salva `site.json` + screenshots em `output/<domain>_<timestamp>/`.
Stack: Node.js, TypeScript estrito, Playwright, Vitest, tsx.
Este arquivo define apenas regras universais; regras por modulo ficam em `.github/instructions/*.instructions.md` (mapa em `.github/instructions/README.md`).

## Invariantes Arquiteturais
- Nunca usar `console.log` fora de `src/logger/`; logs devem passar pelo `Logger`.
- Modulos shared (`src/config/`, `src/logger/`, `src/types/`, `src/utils/`) podem ser importados por qualquer camada.
- Modulos nao-shared nao devem se importar diretamente entre si; a orquestracao ocorre no nivel de aplicacao.
- Modulos shared nao podem importar de crawler, parser, extractors, manifest-builder, filesystem ou queue.

## Idioma
- Codigo: ingles.
- Logs e mensagens de erro para usuario: portugues.
- Testes (`describe` / `it`): portugues.
- Documentacao em `docs/`: portugues.

## TypeScript e Estrutura
- `strict` ativo; sem `any` explicito.
- Sem `default export`; usar named exports.
- Imports Node.js com namespace (`import * as fs from 'fs'`).
- Cada modulo exporta interface publica via `index.ts`; internos nao sao reexportados.

## Funcoes e Dependencias
- Preferir funcoes stateless; classes apenas com estado encapsulado ou contrato claro.
- Maximo de 40 linhas por funcao; decompor quando exceder.
- Parametros obrigatorios antes dos opcionais.
- Orquestradores aceitam dependencias opcionais para facilitar testes sem mock de modulo.

## Erros e Scripts
- Bordas do sistema (CLI, validacao) devem lancar `Error` descritivo.
- Steps de preparacao retornam resultado com falha; nao propagam excecao.
- Tasks internas relancam `Error` com prefixo de contexto.
- Comandos oficiais: `npm run crawl <url>`, `npm run queue -- queue:<sub>`, `npm run safe-queue`, `npm test`, `npm run test:coverage`.

## Fluxo e DoD
- Fluxo: Nova ideia -> Branch -> Implementar -> Testes -> Documentacao -> Safe-Queue -> PR -> Merge.
- Branch padrao: `git checkout -b <tipo>/<descricao-kebab-case>` a partir da `main` atualizada.
- Sem merge direto em `main`; usar PR.
- Toda `feat`, `fix` e `refactor` exige testes de happy path, bordas e erros.
- Definition of Done: implementacao finalizada, testes passando, cobertura >= 90%, `safe-queue` aprovado, logs/erros/documentacao/CHANGELOG atualizados.
