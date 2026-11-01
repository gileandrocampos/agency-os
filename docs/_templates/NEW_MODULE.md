# Novo Modulo (Checklist)

> **Resumo**
> Use este checklist ao introduzir um novo módulo funcional.
> Objetivo: manter contrato, documentação e testes alinhados desde o início.

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
