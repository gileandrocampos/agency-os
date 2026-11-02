> **Resumo**
> Este arquivo reúne os comandos da fila e o fluxo de uso via CLI, incluindo os cenários de enfileiramento, consulta e retry.
> É a leitura recomendada para operar a fila em produção local ou em rotinas de manutenção.
> Código: `src/queue/index.ts`, `src/queue/queue.ts` e `npm run queue`.

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
       ├─ sim → status = 'pending'   (pode ser reprocessado na execução atual ou no próximo queue:run)
       └─ não → status = 'failed'    (encerrado com erro)
```
