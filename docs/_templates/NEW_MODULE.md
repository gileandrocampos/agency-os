# Novo Modulo (Checklist)

> **Resumo**
> Use este checklist ao introduzir um novo módulo funcional.
> Objetivo: manter contrato, documentação e testes alinhados desde o início.

## Checklist operacional obrigatorio

1. Definir a fronteira do modulo (`src/<modulo>/`) e confirmar se ele sera dono de instruction propria ou se pertence a fronteira ja existente.
2. Criar doc com `docs/_templates/module.md` em `docs/<modulo>.md` com bloco `> **Resumo**` no topo; se o modulo pertencer a doc agregado, estender o agregado em vez de criar doc novo.
3. Criar instruction com `docs/_templates/module.instructions.md` em `.github/instructions/<modulo>.instructions.md` com `description` e `applyTo`; se o modulo pertencer a fronteira existente, estender o `applyTo` da instruction daquela fronteira.
4. Adicionar/atualizar a linha do modulo no mapa de `.github/copilot-instructions.md` (modulo, caminho, instruction e doc).
5. Adicionar/atualizar a linha correspondente no indice de `docs/README.md`.
6. Criar testes em `src/__tests__/<modulo>/` seguindo o padrao do repositorio.
7. Se o modulo exigir novo comando operacional, adicionar script no `package.json`.
8. Rodar verificacao final: links/docs atualizados, globs de `applyTo` com match real e cobertura da pasta no mapa + indice.

## Contratos

1. Definir API pública no `src/<modulo>/index.ts`.
2. Definir tipos públicos em `src/<modulo>/types.ts` (quando aplicável).
3. Registrar dependências permitidas e proibições de acoplamento.

## Fluxo

1. Implementar fluxo mínimo funcional (happy path).
2. Tratar falhas esperadas com erros descritivos.
3. Integrar o módulo no orquestrador apropriado (`application`, `crawler` ou `queue`).

## Decisões de design

1. Justificar as principais escolhas técnicas em `docs/<modulo>.md`.
2. Registrar limites de responsabilidade e pontos de extensão.
3. Marcar incertezas como A CONFIRMAR.

## Casos de borda

1. Cobrir entradas inválidas e estados nulos.
2. Cobrir reexecução/idempotência quando aplicável.
3. Cobrir falhas de IO/rede/dependência externa quando aplicável.

## Entregáveis mínimos

1. `docs/<modulo>.md` criado usando `docs/_templates/module.md`.
2. `.github/instructions/<modulo>.instructions.md` criado usando `docs/_templates/module.instructions.md`.
3. Testes em `src/__tests__/<modulo>/` com happy path, bordas e falhas.
