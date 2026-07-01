# Guia de Testes — Freelance OS

Este documento define as regras e padrões obrigatórios de teste para **toda nova feature** adicionada ao projeto. Seguir este guia garante consistência, cobertura mínima de 90% e facilidade de manutenção.

---

## 1. Estrutura de arquivos

```
src/
  <modulo>/
    minha-feature.ts          ← implementação
  __tests__/
    <modulo>/
      minha-feature.test.ts   ← testes unitários
```

- O arquivo de teste espelha exatamente o caminho do arquivo de implementação.
- Um arquivo `.ts` de implementação → um arquivo `.test.ts` correspondente.
- Nunca misturar testes de módulos diferentes no mesmo arquivo.

---

## 2. Imports obrigatórios

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

Importar apenas o que for utilizado no arquivo. Não importar `afterEach` se não houver cleanup.

---

## 3. Idioma

Todas as descrições de `describe` e `it` devem ser escritas em **português**, usando frases verbais claras.

```ts
// ✔ correto
it('retorna o caminho do arquivo gerado', async () => { ... });
it('lança erro para URL sem protocolo http/https', () => { ... });
it('chama page.goto com waitUntil: networkidle', async () => { ... });

// ❌ errado
it('should return file path', async () => { ... });
it('returns generated path', async () => { ... });
```

---

## 4. Mocks — Quando e como usar

### 4.1 Módulos externos (playwright, fs, etc.)

Usar `vi.mock()` no topo do arquivo, fora de qualquer função.

```ts
vi.mock('fs');
```

Para mocks que precisam ser referenciados dentro do `vi.mock()`, usar `vi.hoisted()`:

```ts
const { mockClose, mockPage } = vi.hoisted(() => {
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockPage = {};
  return { mockClose, mockPage };
});

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({ /* ... */ }),
  },
}));
```

### 4.2 Módulos internos (sub-módulos do projeto)

Mock completo com `vi.mock()` sempre que o teste for de um orquestrador (ex: `crawler/index.ts`):

```ts
vi.mock('../../crawler/browser', () => ({
  createBrowserSession: vi.fn().mockResolvedValue(mockSession),
}));
```

### 4.3 Métodos individuais de objetos (ex: `fs`, `console`)

Usar `vi.spyOn()` dentro de `beforeEach` e restaurar em `afterEach`:

```ts
beforeEach(() => {
  writeFileSyncMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
});

afterEach(() => {
  writeFileSyncMock.mockRestore();
});
```

### 4.4 Factory functions para objetos complexos

Quando o teste precisar de objetos como `Page` do Playwright, criar uma factory function no topo do arquivo de teste:

```ts
function makeMockPage(): Partial<Page> & { goto: ReturnType<typeof vi.fn> } {
  return { goto: vi.fn().mockResolvedValue(null) };
}
```

---

## 5. Lifecycle — beforeEach / afterEach

| Situação | O que fazer |
|---|---|
| Testes usam `vi.mock()` com estado | `vi.clearAllMocks()` no `beforeEach` |
| Testes fazem import dinâmico do módulo | `vi.resetModules()` no `beforeEach` |
| Testes usam `vi.spyOn()` | `.mockRestore()` no `afterEach` |
| Testes alteram `process.argv` | salvar e restaurar em `beforeEach`/`afterEach` |

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## 6. Cobertura mínima por feature

Cada nova feature deve cobrir os seguintes cenários:

### 6.1 Funções puras (utils)

| Categoria | Exemplos de casos |
|---|---|
| Happy path | entrada válida retorna valor correto |
| Tipo do retorno | `typeof result === 'string'`, `toBeInstanceOf(URL)` |
| Formato do retorno | regex, length, estrutura |
| Entradas inválidas | string vazia, protocolo errado, tipo incorreto |
| Erro lançado | `expect(() => fn()).toThrowError(...)` |

### 6.2 Módulos com efeitos colaterais (crawler, filesystem, logger)

| Categoria | Exemplos de casos |
|---|---|
| Chama dependência correta | `expect(mock).toHaveBeenCalledWith(...)` |
| Chama dependência uma vez | `toHaveBeenCalledOnce()` |
| Retorna valor esperado | `expect(result).toBe(...)` |
| Retorna caminho correto | `toContain('arquivo.ext')` |
| Propaga erros | `.rejects.toThrow(mensagem)` |
| Ordem de chamadas | `callOrder[]` + `toEqual(['a', 'b'])` |

### 6.3 Orquestradores (ex: `crawler/index.ts`)

| Categoria | Exemplos de casos |
|---|---|
| Resultado final tem shape correto | `toMatchObject({ url, outputDir, ... })` |
| Todos os sub-módulos são chamados | um `it` por dependência principal |
| Argumentos passados corretamente | `toHaveBeenCalledWith(url)` |
| Encerramento de recursos | `close()` chamado ao final |

### 6.4 CLI / Entry points

| Categoria | Exemplos de casos |
|---|---|
| Sem argumento → `process.exit(1)` | mock de `process.exit` com `vi.spyOn` |
| Com URL válida → chama a ação correta | mock do orquestrador |
| Erro na ação → `logError` + `process.exit(1)` | mock de rejeição + verificação dos dois |

### 6.5 Steps e Tasks de preparação (page-preparer)

| Categoria | Exemplos de casos |
|---|---|
| `page.evaluate` chamado uma vez | `toHaveBeenCalledOnce()` |
| Opções corretas passadas para `evaluate` | `toHaveBeenCalledWith(expect.any(Function), options)` |
| Resolve sem retorno em happy path | `resolves.toBeUndefined()` |
| Lança mensagem prefixada em erro | `rejects.toThrow('NomeTask failed: ...')` |
| `PreparationStepResult` correto em sucesso | `toMatchObject({ executed: true, success: true })` |
| `PreparationStepResult` correto em falha | `toMatchObject({ executed: true, success: false })` |

Para steps que dependem de `clickFirstMatch`, mockar o módulo `click-first-match` inteiro:

```ts
vi.mock('../../../crawler/page-preparer/click-first-match', () => ({
  clickFirstMatch: vi.fn().mockResolvedValue(null),
}));
```

---

### 6.6 `PagePreparationService` (orquestrador da pipeline)

Mockar os quatro steps como constructors com `vi.mock()`. Usar `function () {}` (não arrow) nos `mockImplementation` para evitar problemas de contexto:

```ts
vi.mock('../../../crawler/page-preparer/idle-waiter', () => ({
  IdleWaiter: vi.fn().mockImplementation(function () {
    return { name: 'idle-waiter', run: vi.fn() };
  }),
}));
```

Para injetar steps controláveis em `prepare()`, usar o segundo parâmetro do construtor:

```ts
const step = makeStepMock('meu-step', /* success = */ true);
const service = new PagePreparationService(DEFAULT_PREPARATION_CONFIG, [step]);
```

---



Preferir asserts específicos em vez de genéricos:

```ts
// ✔ preferir
expect(mock).toHaveBeenCalledOnce();
expect(mock).toHaveBeenCalledWith('/caminho', { recursive: true });
expect(result).toMatchObject({ url: 'https://example.com/' });

// ❌ evitar
expect(mock).toHaveBeenCalled();    // não valida quantidade
expect(result).toBeTruthy();        // não valida tipo nem valor
```

---

## 8. Testando ordem de chamadas

Quando a **sequência de execução** importa, usar array de controle:

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

## 9. Testando erros propagados

Para funções assíncronas:

```ts
it('propaga erro lançado pela dependência', async () => {
  mockDep.mockRejectedValue(new Error('mensagem de falha'));
  await expect(minhaFuncao()).rejects.toThrow('mensagem de falha');
});
```

Para funções síncronas:

```ts
it('lança erro para entrada inválida', () => {
  expect(() => minhaFuncao('entrada-ruim')).toThrowError(/mensagem parcial/);
});
```

---

## 10. Limites de cobertura

Configurados em `vitest.config.ts`. **Não reduzir os thresholds**:

```ts
thresholds: {
  lines:      90,
  functions:  90,
  branches:   90,
  statements: 90,
}
```

Verificar cobertura antes de abrir PR:

```bash
npm run test:coverage
```

---

## 11. Checklist — Nova feature

Antes de considerar uma feature pronta, verificar:

- [ ] Arquivo de teste criado em `src/__tests__/<modulo>/<arquivo>.test.ts`
- [ ] Descrições em português
- [ ] Happy path coberto
- [ ] Todos os argumentos passados às dependências verificados
- [ ] Erros propagados testados
- [ ] `beforeEach`/`afterEach` com cleanup adequado
- [ ] Nenhum teste depende de outro (ordem de execução não importa)
- [ ] `npm run test:coverage` passa com ≥ 90% em todas as métricas
