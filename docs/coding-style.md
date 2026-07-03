# Coding Style

## Linguagem

TypeScript estrito. Configuração em `tsconfig.json`. Sem `any` explícito.

---

## Idioma

- **Código** (variáveis, funções, classes, interfaces): inglês
- **Logs e mensagens de erro ao usuário**: português
- **Testes** (`describe` / `it`): português
- **Documentação** (`docs/`): português

---

## Módulos

Cada módulo é uma pasta com um `index.ts` que exporta apenas a interface pública. Internos não são reexportados.

```
src/
  <modulo>/
    index.ts          ← exporta apenas o contrato público
    <detalhe>.ts      ← implementação interna
```

---

## Funções

- Funções livres (não métodos) para operações stateless.
- Classes apenas quando há estado encapsulado ou contrato via interface (ex: `PreparationStep`).
- **Máximo de 40 linhas por função.** Funções maiores devem ser decompostas.
- Sem comentários óbvios — o código deve ser autoexplicativo.
- Parâmetros obrigatórios antes dos opcionais. Opcionais com `?` ou valor default.

---

## Injeção de dependência

Orquestradores aceitam dependências como parâmetros opcionais para facilitar testes unitários sem mocks de módulo.

```ts
// ✔ correto — testável sem vi.mock
async function executeCrawl(
  config: CrawlerConfig,
  preparer: PagePreparationService = new PagePreparationService(),
): Promise<CrawlerResult>

// ✔ correto — tasks injetáveis no construtor
constructor(
  private readonly networkIdleTimeout: number,
  domTask?: WaitDomTask,
  fontsTask?: WaitFontsTask,
  imagesTask?: WaitImagesTask,
)
```

---

## `page.evaluate()` — Restrições

Código executado dentro de `page.evaluate()` roda no contexto do browser e não tem acesso ao escopo Node.js.

**Regra obrigatória:** usar **object method shorthand** em vez de arrow functions atribuídas a `const` dentro de `page.evaluate()`.

```ts
// ✔ correto — não sofre injeção de __name() pelo esbuild
const handlers = {
  resolveOnce() { ... },
  scheduleIdle() { ... },
};

// ❌ errado — esbuild injeta __name(fn, "fn"), que não existe no browser
const resolveOnce = () => { ... };
```

> Razão: `tsx` usa `keepNames: true` via esbuild, que envolve arrow const assignments com `__name()`, um helper de módulo não disponível no contexto do browser.

---

## Tratamento de erros

- Lançar `Error` com mensagem descritiva nas bordas do sistema (entrada da CLI, validação de URL).
- Steps de preparação nunca propagam exceções — retornam `PreparationStepResult` com `success: false`.
- Tasks internas relançam como `Error` com contexto prefixado (`WaitDomTask failed: ...`).

---

## Imports

- Imports de Node.js com namespace: `import * as fs from 'fs'`, `import * as path from 'path'`.
- Sem `default exports`. Usar named exports em todos os módulos.
- Ordenação: externos → internos (caminhos relativos mais profundos por último).

---

## Formatação

- Indentação: 2 espaços.
- Ponto e vírgula: obrigatório.
- Aspas: simples.
- Trailing comma: em listas multiline.
