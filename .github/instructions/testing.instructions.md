---
description: Regras obrigatórias para testes unitários e de integração local.
applyTo: "src/__tests__/**"
---

- Mantenha correspondência de escopo: teste de um módulo por arquivo.
- Escreva `describe` e `it` em português com frase verbal clara.
- Importe apenas APIs de `vitest` realmente usadas no arquivo.
- Em mocks de módulo com estado compartilhado, limpe com `vi.clearAllMocks()` no `beforeEach`.
- Em testes com import dinâmico, use `vi.resetModules()` no `beforeEach`.
- Em `vi.spyOn`, sempre restaure no `afterEach`.
- Em testes que alteram `process.argv`, salve e restaure o valor original.
- Para dependência capturada por `vi.mock()`, use `vi.hoisted()` quando necessário.
- Prefira asserts específicos (`toHaveBeenCalledOnce`, `toHaveBeenCalledWith`, `toMatchObject`).
- Em erros assíncronos, valide com `rejects.toThrow`; em síncronos, valide com `toThrow`.
- Em orquestradores, valide shape do resultado, argumentos e ordem de chamadas críticas.

Detalhes: docs/testing.md
