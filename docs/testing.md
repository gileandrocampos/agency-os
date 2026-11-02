# Testing

> **Resumo**
> Este documento concentra as práticas de teste usadas no repositório.
> Base: `vitest.config.ts`, scripts do `package.json` e regras de `testing.instructions.md`.
> Escopo principal dos testes: `src/__tests__/**/*.test.ts`.
> Objetivo operacional: manter cobertura mínima de 90%.

## Contratos

- Runner: `vitest` com `environment: node` e `globals: true`.
- Inclusão de testes: `src/__tests__/**/*.test.ts`.
- Cobertura: provider `v8`, relatórios `text`, `json`, `html`.
- Thresholds mínimos: `lines`, `functions`, `branches`, `statements` em 90%.
- Scripts oficiais:
  - `npm test` -> `vitest run`
  - `npm run test:coverage` -> `vitest run --coverage`
  - `npm run safe-queue` -> `npm test && npm run queue -- queue:run`

## Fluxo

1. Testes são escritos por módulo, em arquivos de escopo correspondente.
2. Cada suite usa `describe`/`it` em português, com frases verbais claras.
3. Dependências externas/estado global são isolados com `vi.mock`, `vi.hoisted`, spies e hooks (`beforeEach`/`afterEach`).
4. Para validação de erro:
  - assíncrono: `rejects.toThrow`
  - síncrono: `toThrow`
5. O comando `safe-queue` só executa fila após a suíte passar.

## Decisões de design

- Regras de estilo de teste foram extraídas para `testing.instructions.md` para manter consistência.
- Asserts específicos são preferidos (`toHaveBeenCalledWith`, `toMatchObject`, etc.).
- Em testes com import dinâmico, `vi.resetModules()` evita acoplamento de cache.
- Em mocks com estado compartilhado, `vi.clearAllMocks()` é usado no `beforeEach`.
- `process.argv` deve ser restaurado quando alterado por testes de CLI.

## Casos de borda

- Testes de fila cobrem duplicidade de URL, prioridade, retries e recuperação de jobs `running`.
- Testes utilitários cobrem entradas inválidas (ex.: protocolo não suportado em URL).
- Spies não restaurados podem vazar estado entre casos; por regra, restaurar em `afterEach`.
- A configuração exclui alguns arquivos da cobertura (`src/cli/index.ts`, por exemplo); qualquer nova exclusão deve vir acompanhada de justificativa e revisão explícita do impacto por módulo no relatório de cobertura.
