# Agency OS — Copilot Instructions

## Projeto

Agency OS é um crawler local em TypeScript que recebe uma URL, renderiza a página com Playwright, extrai dados estruturados (branding, contatos, metadados, parser) e grava `site.json` + screenshots em `output/<domain>_<timestamp>/`.

Stack: Node.js · TypeScript estrito · Playwright · Vitest · tsx (esbuild)

Este arquivo cobre apenas regras universais, aplicadas em qualquer arquivo do repo.
Regras específicas de cada módulo estão em `.github/instructions/*.instructions.md`
(carregam automaticamente quando o Copilot trabalha em arquivos daquele módulo — ver
`.github/instructions/README.md` para o mapa completo).

---

## Invariantes arquiteturais

Estas regras valem em **qualquer** módulo do projeto — não apenas nos módulos Shared:

- **Nunca usar `console.log` direto** fora de `src/logger/`. Toda escrita de log deve passar pelo
  `Logger` (`logInfo`, `logError`, etc.). Violações são bugs de logging, não preferências de estilo.
- **Módulos Shared** (`src/logger/`, `src/utils/`, `src/types/`, `src/config.ts`) podem ser
  importados por qualquer camada. Os demais módulos (Crawler, Parser, extractors, output) **não
  devem importar uns aos outros diretamente** — a orquestração é sempre feita via injeção de
  dependência no nível superior (`crawl-site.usecase.ts` / `Crawler`).
- **Módulos Shared não podem importar** de `src/crawler/`, `src/parser/`, `src/branding-extractor/`,
  `src/contact-extractor/`, `src/manifest-builder/`, ou `src/filesystem/`. Qualquer dependência
  circular nessa direção é um erro de arquitetura.

---

## Idioma

| Contexto | Idioma |
|---|---|
| Código (variáveis, funções, classes, interfaces) | Inglês |
| Logs e mensagens de erro ao usuário | Português |
| Testes (`describe` / `it`) | Português |
| Documentação (`docs/`) | Português |

---

## TypeScript

- `tsconfig.json` com strict mode. Sem `any` explícito.
- Sem `default exports`. Apenas named exports.
- Imports Node.js com namespace: `import * as fs from 'fs'`, `import * as path from 'path'`.
- Ordenação de imports: externos → internos (caminhos mais profundos por último).

---

## Estrutura de módulos

Cada módulo é uma pasta com `index.ts` exportando apenas a interface pública. Internos não são reexportados.

```
src/
  <modulo>/
    index.ts       ← contrato público
    <detalhe>.ts   ← implementação interna
```

---

## Funções

- Funções livres para operações stateless. Classes apenas quando há estado encapsulado ou contrato via interface.
- **Máximo 40 linhas por função.** Decompor se exceder.
- Parâmetros obrigatórios antes dos opcionais.
- Sem comentários óbvios — o código deve ser autoexplicativo.

### Injeção de dependência

Orquestradores aceitam dependências como parâmetros opcionais para facilitar testes unitários sem `vi.mock` de módulo:

```ts
async function executeCrawl(
  config: CrawlerConfig,
  preparer: PagePreparationService = new PagePreparationService(),
): Promise<CrawlerResult>
```

---

## Tratamento de erros

- Bordas do sistema (CLI, validação de URL): lançar `Error` com mensagem descritiva.
- Steps de preparação: nunca propagam — retornam `PreparationStepResult` com `success: false`.
- Tasks internas: relançam como `Error` com prefixo de contexto (`WaitDomTask failed: ...`).

---

## Scripts

| Script | Comando | Descrição |
|---|---|---|
| `npm run crawl <url>` | `tsx src/cli/index.ts crawl` | Executa o crawler |
| `npm run queue -- queue:<sub>` | `tsx src/cli/index.ts` | Comandos de fila (`queue:add`, `queue:run`, `queue:list`, `queue:status`) |
| `npm run safe-queue` | `npm test && npm run queue -- queue:run` | Roda testes; aborta se algum falhar, depois processa a fila |
| `npm run test` | `vitest run` | Suite de testes |
| `npm run test:coverage` | `vitest run --coverage` | Testes com cobertura |

---

## Fluxo de desenvolvimento obrigatório

```
Nova ideia → Branch → Implementar → Testes → Documentação → Safe-Queue → PR → Merge → Excluir branch
```

- **Antes de qualquer código:** entender objetivo e escopo. Perguntar se a tarefa for ambígua.
- **Branch:** criar automaticamente via `git checkout -b <tipo>/<descricao-kebab-case>`, a partir da `main` atualizada. Não esperar o usuário pedir.
- **Implementação:** restrita ao escopo definido. Mudanças fora do escopo → sinalizar, não fazer.
- **Testes:** toda `feat`, `fix` ou `refactor` exige testes cobrindo happy path, bordas e erros.
- **Safe-queue:** executar antes do merge. Nenhum merge sem safe-queue aprovado.
- **Merge:** via Pull Request para `main`. Nunca push direto. Branches `spike/*` exigem revisão humana explícita.
- **Pular etapa:** se o usuário pedir, obedecer mas alertar o risco.

Tipos de branch: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `spike` (nunca merge sem revisão humana), `hotfix`.
Formato: `<tipo>/<descricao-kebab-case>`, minúsculo, sem acentos/underscores, 2–5 palavras.

---

## Definition of Done

Uma feature está concluída quando:

- [ ] Implementação finalizada com responsabilidade única
- [ ] Testes unitários criados e passando
- [ ] Cobertura ≥ 90%
- [ ] Safe-crawl executado com sucesso
- [ ] Logs implementados
- [ ] Tratamento de erros implementado
- [ ] Documentação atualizada
- [ ] CHANGELOG atualizado
- [ ] Branch pronta para merge via PR
