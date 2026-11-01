---
description: Regras do modulo <nome-do-modulo>.
applyTo: "src/<modulo>/**"
---

- Mantenha o contrato público apenas em `index.ts` do módulo.
- Prefira funções puras; introduza estado apenas quando necessário.
- Preserve mensagens de erro em português na borda exposta ao usuário.
- Adicione/ajuste testes de happy path, bordas e falhas para qualquer alteração de comportamento.
- Não reexporte implementações internas que não fazem parte da API pública.

Detalhes: docs/<nome-do-modulo>.md
