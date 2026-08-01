# Mapa de instructions do Agency OS

Este projeto usa dois níveis de instruções para o Copilot:

1. **`.github/copilot-instructions.md`** — sempre carregado, em toda interação, independente
   do arquivo em que o Copilot está trabalhando. Contém só o que é universal: idioma, regras
   de TypeScript, convenção de funções/erros, scripts e o fluxo de trabalho obrigatório (branch,
   testes, safe-crawl, PR, Definition of Done).

2. **`.github/instructions/*.instructions.md`** — carregados **somente** quando o Copilot está
   trabalhando em um arquivo cujo caminho bate com o `applyTo` (glob) do topo do arquivo.
   Isso evita que a tabela de arquitetura inteira (18 módulos) entre no contexto de toda tarefa,
   mesmo quando ela só toca um módulo.

## Por que agrupado assim, e não 1 arquivo por módulo

Os 18 módulos do projeto foram agrupados em 5 arquivos por **fronteira de responsabilidade**,
não 1:1 com cada pasta — isso mantém o número de arquivos gerenciável e agrupa módulos que
sempre são tocados juntos numa mesma feature:

| Arquivo | `applyTo` | Cobre |
|---|---|---|
| `entrypoint.instructions.md` | `src/cli/**`, `src/crawl-site.usecase.ts` | CLI, Application |
| `crawler.instructions.md` | `src/crawler/**` | Crawler, Browser, PageLoader, PagePreparer, Screenshot, HtmlSaver |
| `extraction.instructions.md` | `src/parser/**`, `src/branding-extractor/**`, `src/contact-extractor/**` | Parser, BrandingExtractor, ContactExtractor, MetadataExtractor |
| `output.instructions.md` | `src/manifest-builder/**`, `src/filesystem/**` | ManifestBuilder, FileSystem |
| `shared.instructions.md` | `src/logger/**`, `src/utils/**`, `src/types/**`, `src/config.ts` | Logger, Utils, Types, Config |

## Quando editar o quê

- Regra que vale para o projeto inteiro (ex.: "sempre em português nos logs") → `copilot-instructions.md` raiz.
- Regra específica de um módulo (ex.: "Screenshot não decide quando capturar") → o `.instructions.md`
  correspondente.
- Novo módulo criado → adicionar linha na tabela do arquivo de grupo mais próximo, ou criar um
  novo `.instructions.md` se o módulo abrir uma fronteira de responsabilidade nova.

## Suporte por ferramenta

Path-specific instructions (`applyTo`) hoje funcionam em: Copilot Chat no VS Code, Visual Studio,
e Copilot cloud agent. Se o time também usa Copilot em outro client, vale confirmar suporte antes
de depender só desses arquivos — na dúvida, a regra crítica pode ser duplicada de forma resumida
no `copilot-instructions.md` raiz como rede de segurança.
