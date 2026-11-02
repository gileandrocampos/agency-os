# Documentação do projeto

## Índice central

| módulo | caminho | resumo de 1 linha | quando ler |
|---|---|---|---|
| CLI + Application | `src/cli/**`, `src/application/**` | Borda de entrada da aplicação com comandos e use cases finos. | Quando alterar argumentos, comandos, validação ou fluxo de entrada. |
| Crawler | `src/crawler/**` | Orquestra a sessão de crawl, cria a saída e produz os artefatos da renderização. | Quando mexer em browser, carregamento, screenshots, HTML ou sessão do crawl. |
| Page Preparation | `src/crawler/page-preparer/**` | Prepara a página antes da captura e da extração para reduzir ruído e overlays. | Quando ajustar waits, cookies, overlay, lazy load e preparar a página. |
| Queue | `src/queue/**` | Implementa fila persistente com status, retries e processamento sequencial. | Quando mexer em jobs, persistência, replay ou execução da fila. |
| Shared / Core | `src/config/**`, `src/logger/**`, `src/types/**`, `src/utils/**` | Consolida contratos e utilitários estáveis usados por outros módulos. | Quando mexer em config global, log, tipos públicos ou funções reutilizáveis. |
| Parser + Extractors | `src/parser/**`, `src/branding-extractor/**`, `src/contact-extractor/**` | Recebe HTML renderizado e produz dados estruturados de página, marca e contato. | Quando alterar extração por DOM, metadata, branding ou contatos. |
| Output / Manifest | `src/manifest-builder/**`, `src/filesystem/**` | Consolida os resultados em `site.json` e persiste a sessão de saída. | Quando mexer em manifesto final, schema e persistência em disco. |
| Testes | `src/__tests__/**` | Centraliza as práticas e thresholds de cobertura do projeto. | Quando escrever ou ajustar testes e validar regressões. |

## Como as instruções são usadas

- `.github/copilot-instructions.md` define regras universais do projeto.
- `.github/instructions/*.instructions.md` filtra regras por fronteira de responsabilidade.
- Os documentos em `docs/` detalham os módulos e o fluxo recomendado de leitura.

## Relatório de aceite

| Critério | Resultado | Observação |
|---|---|---|
| `copilot-instructions.md` <= 60 linhas | PASS | Arquivo reduzido e com o mapa de módulos atualizado. |
| Todo `.instructions.md` <= 40 linhas | PASS | Os 7 arquivos de instrução continuam curtos e com `description` + `applyTo`. |
| Todo módulo em `src/` com instruction + doc + linha no mapa | PASS | Mapas alinhados às pastas reais do repositório. |
| Links internos sem quebra | PASS | Validação local de links relativos concluída. |
| Sem referências obsoletas e caminhos antigos | PASS | Referências atualizadas para `safe-queue` e caminhos atuais. |
| Sem regras duplicadas entre camadas | PASS | Regras globais no root; específicas por fronteira em `.github/instructions/`. |
| Tabela antes/depois de tokens estimados | PASS | Dados estimados abaixo do alvo de documentação por módulo. |

### Tokens estimados

| Escopo | Antes (est.) | Depois (est.) | Observação |
|---|---:|---:|---|
| Documentação + instruções | 14.6k tokens | 14.4k tokens | Manutenção no limite sem crescimento relevante. |

> Cálculo: 1 token ≈ 3,5 caracteres. Os valores são estimados por tamanho de arquivo e úteis para acompanhamento da meta documental.

### Lista de itens marcados "A CONFIRMAR"

- `docs/core.md`: a criação do diretório/arquivo do logger continua como ponto de confirmação no fluxo de bootstrap externo.
- `docs/testing.md`: impacto da cobertura com exclusões específicas deve ser confirmado quando novas exclusões forem propostas.
- `docs/_templates/module.md`: borda 3 permanece marcada como A CONFIRMAR quando necessário.
- `docs/_templates/NEW_MODULE.md`: incertezas devem continuar marcadas como A CONFIRMAR.

## Referências rápidas

- `docs/core.md` — base compartilhada e contratos públicos.
- `docs/application.md` — CLI e use cases.
- `docs/crawler/README.md` — pipeline principal do crawler.
- `docs/page-preparation/README.md` — preparação da página antes da captura.
- `docs/queue/README.md` — fila persistente e processamento.
- `docs/testing.md` — práticas e cobertura.
