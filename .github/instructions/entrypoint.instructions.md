---
description: Regras da borda de entrada CLI e use cases de aplicação.
applyTo: "src/cli/**,src/application/**"
---

- Use `src/cli/**` como camada de borda para `process.argv` e `process.exit`.
- Faça validação de URL e argumentos na CLI antes de chamar use cases.
- Em erro de entrada inválida na CLI, lance `Error` descritivo em português.
- Não coloque lógica de domínio nos use cases de `src/application/**`.
- Em `src/application/**`, apenas orquestre dependências e traduza retorno para a camada chamadora.
- Não acople CLI diretamente a módulos internos do crawler; passe sempre por use case.

Detalhes: docs/application.md
