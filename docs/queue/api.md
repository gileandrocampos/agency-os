> **Resumo**
> Este arquivo reúne as operações de CRUD da fila e o consumer do processamento sequencial.
> É o ponto de leitura para consultar a API pública, as regras de retry e o ciclo de execução dos jobs.
> Código: `src/queue/queue.ts` e `src/queue/consumer.ts`.

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


