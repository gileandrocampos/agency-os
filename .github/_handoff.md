# Handoff Temporario (nao commitar)

Data: 2026-11-01
Branch atual: chore/reorganize-copilot-context

## Decisoes tomadas
- Fluxo por lotes com 1 commit por lote e pausa para validacao: (a) instructions, (b) copilot-instructions.md, (c) docs agregados + templates, (d) divisao dos docs longos, (e) docs/README.md.
- Comando oficial: `safe-queue` (remover qualquer mencao a `safe-crawl`).
- Agrupamento por fronteira:
  - entrypoint -> `src/cli/**`, `src/application/**`
  - shared -> `src/config/**`, `src/logger/**`, `src/types/**`, `src/utils/**`
  - output -> `src/manifest-builder/**`, `src/filesystem/**`
  - queue -> `src/queue/**`
  - testing -> `src/tests/**`
- Docs agregados: apenas `docs/core.md` e `docs/application.md`.
- Docs longos vao virar pastas com `README.md` + subarquivos: `docs/crawler/`, `docs/page-preparation/`, `docs/queue/`.
- Nada de `instructions-map.md`; mover/fundir README antigo de `.github/instructions/` em `docs/README.md`.
- Padrao: `copilot-instructions.md` <= 60 linhas; cada `.instructions.md` <= 40 linhas com `description` + `applyTo`; todo doc inicia com bloco "Resumo" (max 10 linhas).
- Escopo de alteracao: apenas `.github/` e `docs/`.

## O que foi feito
- Passo 0 reconstruido no git (log/show/status).
- Lote (a) ja estava feito no historico:
  - commit `80ad22c` em `feat/queue-jobs`: `chore(instructions): enxuga regras e corrige applyTo por fronteira`.
- Branch de trabalho correta criada para reorganizacao:
  - `chore/reorganize-copilot-context`.
- Lote (b) concluido:
  - arquivo editado: `.github/copilot-instructions.md`
  - resultado: arquivo reduzido para 36 linhas e com `safe-queue`.
  - commit: `2197d20` -> `chore(copilot): enxuga regras globais e normaliza safe-queue`.
- Checagem de links executada (interna, markdown local): `OK_LINKS 20`.
- Lote (c) concluido (docs agregados + templates):
  - arquivos criados:
    - `docs/core.md`
    - `docs/application.md`
    - `docs/testing.md`
    - `docs/_templates/module.md`
    - `docs/_templates/module.instructions.md`
    - `docs/_templates/NEW_MODULE.md`
  - checagem de links markdown local: `OK_LINKS 0 quebrados`.
  - commit: `ca4f4fb` -> `docs: add aggregated core/application/testing docs and templates`.
- Lote (d1) concluido: `docs/crawler/` split por responsabilidade em `README.md`, `overview.md`, `orchestration.md` e `supporting.md`.
  - preservou o histórico no principal com `git mv docs/crawler.md docs/crawler/overview.md`.
  - resumo e índice adicionados, sem reescrita do conteúdo existente.
  - checagem de estrutura: todos os headings e tabelas do original mantidos em algum subarquivo; total de palavras >= original.
  - referencia `Detalhes: docs/crawler/README.md` validada em `.github/instructions/crawler.instructions.md`.
- Lote (d2) concluido: `docs/page-preparation/` split por responsabilidade em `README.md`, `overview.md`, `contracts.md`, `steps.md`, `tasks.md` e `runtime.md`.
  - preservou o histórico com `git mv docs/page-preparation.md docs/page-preparation/overview.md`.
  - resumo e índice adicionados; o conteúdo foi movido sem parfrasear ou condensar.
  - checagem de estrutura: todos os headings do original mantidos em algum subarquivo e total de palavras >= original.
  - observacao: o conteudo pertence conceitualmente ao crawler, mas foi mantido separado em `docs/page-preparation/` conforme a decisao vigente.
- Lote (d3) concluido: `docs/queue/` split por responsabilidade em `README.md`, `overview.md`, `api.md`, `cli.md` e `storage.md`.
  - preservou o histórico com `git mv docs/queue.md docs/queue/api.md`.
  - a referência de API (queue, types, consumer, storage) foi separada do uso via CLI/comandos.
  - checagem de preservação: todos os trechos principais do original continuam presentes e total de palavras >= original; checagem de links local `broken_links=0`.

## O que falta
- Executar lote (e): consolidar/fundir `docs/README.md` (incluindo conteudo vindo de `.github/instructions/README.md`).
- Garantir meta de tokens de docs (nao crescer; alvo <= ~14.6k).
- Rodar checagem de links ao final de cada lote e commitar 1 lote por commit.

## Proximo passo exato
1. Permanecer em `chore/reorganize-copilot-context`.
2. Fazer commit do lote D3: `docs(queue): split into docs/queue/ by responsibility`.
3. Pausar para validacao final do lote de docs longos.
4. Aguardar instrucao para iniciar o lote (e).
