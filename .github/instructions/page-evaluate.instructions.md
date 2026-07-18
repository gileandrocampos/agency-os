---
applyTo: "src/crawler/**/*"
---

# Restrição: `page.evaluate()` no contexto do browser

Código dentro de `page.evaluate()` roda no browser e **não tem acesso ao escopo Node.js**.

## Regra obrigatória

Usar **object method shorthand** em vez de arrow functions atribuídas a `const`.

```ts
// ✔ correto — não sofre injeção de __name() pelo esbuild
const handlers = {
  resolveOnce() { ... },
  scheduleIdle() { ... },
};

// ❌ errado — esbuild injeta __name(fn, "fn"), helper inexistente no browser
const resolveOnce = () => { ... };
```

**Motivo:** `tsx` usa `keepNames: true` via esbuild, que envolve arrow const assignments com `__name()`. Esse helper de módulo não existe no contexto do browser e causa runtime error.
