> **Resumo**
> Este módulo implementa uma fila persistente de jobs para processamento sequencial de crawls.
> Entradas: URLs e metadados opcionais de empresa, prioridade e configurações específicas por job.
> Saídas: processamento, retries, status e persistência em SQLite em `data/queue.db`.
> Dependências: `src/queue/**`, `src/logger/**`, `src/types/**` e a execução do crawler via `safe-queue`.
> Código: `src/queue/**`.

# Queue

## Índice

| Arquivo | O que contém | Quando ler |
|----------|--------------|------------|
| [overview.md](./overview.md) | Visão geral do módulo, interface pública e tipos do job | Para entender o modelo da fila e os contratos da API |
| [api.md](./api.md) | CRUD da fila, consumer e regras de processamento | Para consultar as operações de execução e recuperação de jobs |
| [cli.md](./cli.md) | Comandos do CLI, exemplos de uso e fluxo de retry | Para operar a fila em linha de comando |
| [storage.md](./storage.md) | Persistência em SQLite e schema do banco | Para confirmar como a fila é armazenada e recuperada |
