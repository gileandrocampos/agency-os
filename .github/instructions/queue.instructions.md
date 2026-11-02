---
description: Regras de persistência e processamento da fila de jobs.
applyTo: "src/queue/**"
---

- Mantenha `src/queue/**` como camada única de acesso ao armazenamento da fila.
- Preserve a semântica de status dos jobs (`pending`, `running`, `done`, `failed`).
- Evite side-effects fora das funções de fila ao mudar estado de job.
- Garanta atualização consistente de `attempts`, `max_attempts` e mensagem de erro.
- Ao consumir fila, processe jobs de forma sequencial salvo decisão explícita contrária.
- Ao recuperar jobs interrompidos, normalize `running` para estado seguro antes de novo consumo.
- Ao alterar ordenação/prioridade, mantenha testes cobrindo desempate e determinismo.
- Não duplique regras de persistência no CLI; CLI só orquestra comandos.

Detalhes: docs/queue/README.md
