> **Resumo**
> Este arquivo apresenta a visão geral do módulo de fila, a interface pública e o modelo principal dos jobs.
> É o ponto de entrada para entender o contrato do sistema de enfileiramento e o que cada job representa.
> Código: `src/queue/index.ts` e `src/queue/queue.ts`.

# Módulo Queue

Documentação do sistema de fila persistente do Agency OS.

Arquivo: `src/queue/`

---

## Visão geral

O módulo `queue` implementa uma fila de crawl persistida em SQLite (`better-sqlite3`). Permite enfileirar múltiplas URLs, processar os jobs de forma sequencial e acompanhar o status de cada execução.

A fila é armazenada em `data/queue.db` (ignorada pelo `.gitignore`).

---

## Interface pública (`src/queue/index.ts`)

```ts
import {
  enqueue,
  list,
  getNext,
  markDone,
  markFailed,
  recoverRunningJobs,
  retryFailedByUrl,
  countPending,
  findByUrl,
  processQueue,
} from './queue';
import type { CrawlJobConfig, Job, JobPriority, JobStatus, QueueJobExecutor } from './queue';
```

---

## Tipos

### `JobStatus`

```ts
type JobStatus = 'pending' | 'running' | 'done' | 'failed';
```

### `Job`

| Campo           | Tipo             | Descrição                                             |
|-----------------|------------------|-------------------------------------------------------|
| `id`            | `string`         | UUID gerado automaticamente                           |
| `url`           | `string`         | URL a ser crawleada (única na tabela)                 |
| `company_name`  | `string \| null` | Nome da empresa (opcional)                            |
| `priority`      | `'low' \| 'normal' \| 'high'` | Prioridade para ordenação no consumo                  |
| `config`        | `CrawlJobConfig \| null` | Configurações de execução específicas do job          |
| `status`        | `JobStatus`      | Estado atual do job                                   |
| `attempts`      | `number`         | Quantidade de tentativas realizadas                   |
| `max_attempts`  | `number`         | Limite de tentativas antes de marcar como `failed`    |
| `error`         | `string \| null` | Mensagem do último erro (se houver)                   |
| `created_at`    | `string`         | ISO 8601 do momento de criação                        |
| `updated_at`    | `string`         | ISO 8601 da última atualização                        |

---
