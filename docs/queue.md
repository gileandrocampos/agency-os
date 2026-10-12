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

## Funções de CRUD (`queue.ts`)

### `enqueue(input): EnqueueResult`

Adiciona uma URL à fila. Se a URL já existir, retorna o job existente sem criar um duplicado.

**Parâmetros:**

| Campo           | Tipo     | Padrão | Descrição               |
|-----------------|----------|--------|-------------------------|
| `url`           | `string` | —      | URL a enfileirar        |
| `company_name`  | `string` | `null` | Nome da empresa         |
| `priority`      | `JobPriority` | `normal` | Prioridade do job     |
| `config`        | `CrawlJobConfig` | `null` | Config específica do job |
| `max_attempts`  | `number` | `1`    | Máximo de tentativas    |

**Retorno:**

```ts
type EnqueueResult =
  | { created: true; job: Job }
  | { created: false; reason: 'duplicate'; existingJob: Job };
```

---

### `list(filter?): Job[]`

Lista todos os jobs, com filtro opcional por status.

```ts
list()                        // todos
list({ status: 'pending' })  // só pendentes
```

---

### `getNext(): Job | null`

Retorna o próximo job pendente por ordem de prioridade (`high` → `normal` → `low`) e data de criação. O job é marcado como `running` de forma atômica.

---

### `markDone(id: string): void`

Marca o job como `done`.

---

### `markFailed(id: string, errorMessage: string): void`

Incrementa `attempts`. Se `attempts < max_attempts`, o job volta para `pending` (retry automático). Caso contrário, muda para `failed` e persiste a mensagem de erro.

Lança `Error` se o `id` não existir.

---

### `recoverRunningJobs(): number`

Reencaminha jobs `running` para `pending` (útil em restart após crash). Retorna quantidade de jobs recuperados.

---

### `retryFailedByUrl(url: string): boolean`

Move um job `failed` para `pending`, reseta `attempts` e limpa `error`. Retorna `true` quando houve atualização.

---

### `countPending(): number`

Retorna o total de jobs com status `pending`.

---

### `findByUrl(url: string): Job | undefined`

Busca um job pela URL. Retorna `undefined` se não encontrado.

---

## Consumer (`consumer.ts`)

### `processQueue(executor?): Promise<void>`

Processa todos os jobs pendentes em sequência:

1. Recupera jobs `running` com `recoverRunningJobs()`
2. Conta os pendentes com `countPending()`
3. Ativa modo silencioso no logger (`setSilent(true)`) para suprimir logs individuais de crawl
4. Itera com `getNext()` → `executor.execute(job)` → `markDone()` ou `markFailed()`
5. Restaura o logger (`setSilent(false)`) no bloco `finally`
6. Exibe resumo final via `logQueue()`

`executor` é injetável via interface `QueueJobExecutor`, permitindo paralelização/distribuição futura sem acoplamento à implementação interna do crawler.

---

## Comandos CLI

| Comando                              | Descrição                              |
|--------------------------------------|----------------------------------------|
| `queue:add [--priority] [--max-attempts] <urls...>` | Enfileira URLs com prioridade e tentativas |
| `queue:run`                          | Processa todos os jobs pendentes       |
| `queue:list [-s <status>]`           | Lista os jobs (com filtro opcional)    |
| `queue:status <url>`                 | Exibe o detalhe de um job pela URL     |
| `queue:retry <url>`                  | Reencaminha um job `failed` para `pending` |

**Fluxo recomendado:**

```bash
# 1. Adicionar URLs na fila
npm run queue -- queue:add https://exemplo.com https://outro.com

# 1.1) Enfileirar com prioridade alta e até 3 tentativas
npm run queue -- queue:add --priority high --max-attempts 3 https://exemplo.com

# 2. Verificar a fila
npm run queue -- queue:list

# 3. Processar (com gate de testes)
npm run safe-queue
```

> `npm run safe-queue` equivale a `npm test && npm run queue -- queue:run`.
> Se algum teste falhar, a fila **não** é processada.

---

## Fluxo de retry

```
markFailed(id, msg)
  └─ attempts + 1 < max_attempts?
       ├─ sim → status = 'pending'   (será reprocessado no próximo queue:run)
       └─ não → status = 'failed'    (encerrado com erro)
```

---

## Armazenamento

O banco SQLite é criado automaticamente em `data/queue.db` na primeira execução. O diretório `data/` está no `.gitignore`.

Schema da tabela `jobs`:

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  url           TEXT NOT NULL UNIQUE,
  company_name  TEXT,
  priority      TEXT NOT NULL DEFAULT 'normal',
  config_json   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  attempts      INTEGER DEFAULT 0,
  max_attempts  INTEGER DEFAULT 1,
  error         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```
