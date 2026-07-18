# Agency OS — Copilot Instructions

## Projeto

Agency OS é um crawler local em TypeScript que recebe uma URL, renderiza a página com Playwright, extrai dados estruturados (branding, contatos, metadados, parser) e grava `site.json` + screenshots em `output/<domain>_<timestamp>/`.

Stack: Node.js · TypeScript estrito · Playwright · Vitest · tsx (esbuild)

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

## Arquitetura — Módulos e responsabilidades

| Módulo | Localização | Responsabilidade |
|---|---|---|
| CLI | `src/cli/index.ts` | Ponto de entrada: parseia args e delega ao Crawler |
| Crawler | `src/crawler/index.ts` | Orquestra o fluxo completo de uma sessão |
| Browser | `src/crawler/browser.ts` | Cria e fecha sessão Playwright |
| PageLoader | `src/crawler/page-loader.ts` | Navega para a URL e aguarda `networkidle` |
| PagePreparer | `src/crawler/page-preparer/` | Pipeline de preparação antes da captura |
| Screenshot | `src/crawler/screenshot.ts` | Captura fullpage por viewport |
| HtmlSaver | `src/crawler/html-saver.ts` | Salva HTML renderizado em disco |
| Parser | `src/parser/index.ts` | Extrai dados estruturados do HTML |
| BrandingExtractor | `src/branding-extractor/` | Logo, cores, fontes, tema, componentes |
| ContactExtractor | `src/contact-extractor/` | Telefone, WhatsApp, e-mail, endereço, redes sociais |
| MetadataExtractor | `src/parser/metadata-extractor.ts` | Metadados do `<head>` |
| ManifestBuilder | `src/manifest-builder/` | Consolida tudo em `site.json` |
| FileSystem | `src/filesystem/index.ts` | Cria diretórios e constrói caminhos de sessão |
| Logger | `src/logger/index.ts` | Logs prefixados com timestamp (console + arquivo) |
| Utils | `src/utils/` | Funções puras: validação de URL, domínio, timestamp |
| Types | `src/types/` | Interfaces e constantes compartilhadas |
| Config | `src/config.ts` | Paths globais (`LOGS_DIR`, `OUTPUT_DIR`) |

---

## Scripts

| Script | Comando | Descrição |
|---|---|---|
| `npm run crawl` | `tsx src/cli/index.ts <url>` | Executa o crawler |
| `npm run safe-crawl` | `tsx scripts/run.ts <url>` | Roda testes; aborta se algum falhar |
| `npm run test` | `vitest run` | Suite de testes |
| `npm run test:coverage` | `vitest run --coverage` | Testes com cobertura |

---

## Fluxo de desenvolvimento obrigatório

```
Nova ideia → Branch → Implementar → Testes → Documentação → Safe-Crawl → PR → Merge → Excluir branch
```

- **Antes de qualquer código:** entender objetivo e escopo. Perguntar se a tarefa for ambígua.
- **Branch:** criar automaticamente via `git checkout -b <tipo>/<descricao-kebab-case>`, a partir da `main` atualizada (`git pull origin main`). Não esperar o usuário pedir.
- **Implementação:** restrita ao escopo definido. Mudanças fora do escopo → sinalizar, não fazer.
- **Testes:** toda `feat`, `fix` ou `refactor` exige testes cobrindo happy path, bordas e erros. Não avançar com testes falhando.
- **Safe-crawl:** executar antes do merge. Nenhum merge sem safe-crawl aprovado.
- **Merge:** via Pull Request para `main`. Nunca push direto. Branches `spike/*` exigem revisão humana explícita.
- **Pular etapa:** se o usuário pedir, obedecer mas alertar o risco.

---

## Convenção de branches

```
<tipo>/<descricao-kebab-case>
```

Minúsculo, sem acentos, sem underscores, 2–5 palavras. Com issue: `feat/seo-analyzer-123`.

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `docs` | Apenas documentação |
| `test` | Criação/ajuste de testes |
| `chore` | Manutenção (deps, configs, build) |
| `perf` | Melhoria de performance |
| `spike` | Experimentação — nunca merge sem revisão humana |
| `hotfix` | Correção urgente de produção |

**Regra:** criar a branch de fato (`git checkout -b ...`), não apenas sugerir o nome.

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
