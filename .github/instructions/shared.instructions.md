---
applyTo: "src/logger/**,src/utils/**,src/types/**,src/config.ts"
---

# Shared — Logger, Utils, Types, Config

## Módulos cobertos

| Módulo | Localização | Responsabilidade |
|---|---|---|
| Logger | `src/logger/index.ts` | Logs prefixados com timestamp (console + arquivo) |
| Utils | `src/utils/` | Funções puras: validação de URL, domínio, timestamp |
| Types | `src/types/` | Interfaces e constantes compartilhadas |
| Config | `src/config.ts` | Paths globais (`LOGS_DIR`, `OUTPUT_DIR`) |

## Regras específicas

- Estes são os únicos módulos que podem ser importados por **qualquer** outra camada do projeto
  (CLI, Crawler, extractors, output) sem quebrar a separação de responsabilidades — não devem,
  por sua vez, importar nada de fora desta lista (zero dependência de volta para `crawler/`,
  `parser/`, etc.).
- `Utils` só aceita funções puras e sem estado. Se uma função precisar de I/O ou de dependência
  externa, ela não pertence aqui — mover para o módulo que a usa.
- `Types` centraliza apenas interfaces/tipos usados por 2+ módulos. Tipo usado por um único módulo
  fica local a ele, não aqui.
- `Logger` é a única forma permitida de escrever em console/arquivo de log — não usar
  `console.log` direto fora deste módulo.
- Mudança em `Config` (paths globais) impacta todo o projeto — tratar como mudança de alto risco,
  mesmo que pareça pequena.
