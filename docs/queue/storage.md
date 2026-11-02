> **Resumo**
> Este arquivo descreve a persistência da fila em SQLite e o schema da tabela de jobs.
> É a leitura recomendada para confirmar como os jobs são persistidos, recuperados e reprocessados.
> Código: `src/queue/queue.ts` e o banco `data/queue.db`.

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
