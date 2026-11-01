---
description: Regras do pipeline de crawl e preparação de página.
applyTo: "src/crawler/**"
---

- Mantenha `src/crawler/index.ts` como único orquestrador da ordem do pipeline.
- Não faça módulos internos do crawler chamarem uns aos outros fora do orquestrador.
- Garanta fechamento de sessão Playwright em todos os caminhos, inclusive erro (`try/finally`).
- Em `page-preparer`, steps não propagam exceção: retorne `PreparationStepResult` com `success: false`.
- Registre novos steps no pipeline do `PagePreparationService`; não deixe step órfão.
- Em tasks internas, relance falhas com prefixo de contexto (`<TaskName> failed: ...`).
- Em `screenshot` e `html-saver`, implemente apenas I/O; decisão de quando executar fica no orquestrador.
- Em `page.evaluate()`, evite arrow function atribuída a `const` quando houver risco de helper de build no contexto do browser.

Detalhes: docs/crawler/README.md
