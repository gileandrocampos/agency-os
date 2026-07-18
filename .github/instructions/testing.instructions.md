---
applyTo: "src/__tests__/**/*"
---

# Padrões de teste — Agency OS

## Estrutura de arquivos

```
src/
  <modulo>/minha-feature.ts
  __tests__/<modulo>/minha-feature.test.ts
```

Um arquivo `.ts` → um arquivo `.test.ts` correspondente. Nunca misturar módulos diferentes no mesmo arquivo de teste.

---

## Imports obrigatórios

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

Importar apenas o que for utilizado.

---

## Idioma

Todas as descrições de `describe` e `it` em **português**, frases verbais claras.

```ts
// ✔
it('retorna o caminho do arquivo gerado', async () => { ... });
// ❌
it('should return file path', async () => { ... });
```

---

## Mocks

### Módulos externos (playwright, fs, etc.)

```ts
vi.mock('fs');
```

Para referências dentro do `vi.mock()`, usar `vi.hoisted()`:

```ts
const { mockClose } = vi.hoisted(() => ({ mockClose: vi.fn().mockResolvedValue(undefined) }));
vi.mock('playwright', () => ({ chromium: { launch: vi.fn().mockResolvedValue({ close: mockClose }) } }));
```

### Módulos internos (orquestradores)

```ts
vi.mock('../../crawler/browser', () => ({
  createBrowserSession: vi.fn().mockResolvedValue(mockSession),
}));
```

### Métodos individuais (`fs`, `console`, etc.)

```ts
beforeEach(() => { writeMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {}); });
afterEach(() => { writeMock.mockRestore(); });
```

### Factory para objetos complexos (ex: `Page`)

```ts
function makeMockPage(): Partial<Page> & { goto: ReturnType<typeof vi.fn> } {
  return { goto: vi.fn().mockResolvedValue(null) };
}
```

---

## Lifecycle

| Situação | O que fazer |
|---|---|
| Testes usam `vi.mock()` com estado | `vi.clearAllMocks()` no `beforeEach` |
| Testes fazem import dinâmico | `vi.resetModules()` no `beforeEach` |
| Testes usam `vi.spyOn()` | `.mockRestore()` no `afterEach` |
| Testes alteram `process.argv` | salvar e restaurar em `beforeEach`/`afterEach` |

---

## Cobertura mínima por categoria

### Funções puras (utils)
- Happy path, tipo e formato do retorno, entradas inválidas, erro lançado

### Módulos com efeitos colaterais (crawler, filesystem, logger)
- Chama dependência correta (`toHaveBeenCalledWith`), chama uma vez (`toHaveBeenCalledOnce`), retorno esperado, propagação de erros, ordem de chamadas

### Orquestradores (`crawler/index.ts`)
- Shape do resultado (`toMatchObject`), todos os sub-módulos chamados, argumentos corretos, encerramento de recursos

### CLI / Entry points
- Sem argumento → `process.exit(1)`, com URL válida → ação correta, erro → `logError` + `process.exit(1)`

### Steps e Tasks (`page-preparer`)
- `page.evaluate` chamado uma vez, `PreparationStepResult` correto em sucesso e em falha, erro prefixado (`NomeTask failed: ...`)
- Para steps com `clickFirstMatch`: `vi.mock('../../../crawler/page-preparer/click-first-match', ...)`

### `PagePreparationService`
- Mockar steps como constructors com `function () {}` (não arrow) no `mockImplementation`
- Injetar steps controláveis via segundo parâmetro do construtor

---

## Asserts

```ts
// ✔ preferir
expect(mock).toHaveBeenCalledOnce();
expect(mock).toHaveBeenCalledWith('/caminho', { recursive: true });
expect(result).toMatchObject({ url: 'https://example.com/' });

// ❌ evitar
expect(mock).toHaveBeenCalled();
expect(result).toBeTruthy();
```

---

## Ordem de chamadas

```ts
it('chama context.close antes de browser.close', async () => {
  const callOrder: string[] = [];
  mockContext.close.mockImplementation(async () => { callOrder.push('context'); });
  mockBrowser.close.mockImplementation(async () => { callOrder.push('browser'); });
  await session.close();
  expect(callOrder).toEqual(['context', 'browser']);
});
```

---

## Erros propagados

```ts
// assíncrono
mockDep.mockRejectedValue(new Error('mensagem'));
await expect(minhaFuncao()).rejects.toThrow('mensagem');

// síncrono
expect(() => minhaFuncao()).toThrow('mensagem');
```
