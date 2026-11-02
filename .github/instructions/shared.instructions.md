---
description: Regras para módulos compartilhados e estáveis do projeto.
applyTo: "src/config/**,src/logger/**,src/types/**,src/utils/**"
---

- Considere estes módulos como base compartilhada entre camadas.
- Não importe módulos de domínio (`crawler`, `parser`, extractors, output, queue) a partir de shared.
- Em `src/utils/**`, mantenha apenas funções puras e sem estado.
- Em `src/types/**`, mantenha tipos usados por mais de um módulo.
- Em `src/logger/**`, centralize toda escrita de logs; fora desse módulo, não use `console.log` direto.
- Em `src/config/**`, trate mudança de path/config global como alteração de alto impacto.

Detalhes: docs/core.md
