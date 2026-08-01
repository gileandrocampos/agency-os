---
applyTo: "src/cli/**,src/crawl-site.usecase.ts"
---

# Entrypoint — CLI e Application

## Módulos cobertos

| Módulo | Localização | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Ponto de entrada: parseia args e delega ao Crawler |
| Application | `src/crawl-site.usecase.ts` | Ponte entre CLI e domínio |

## Regras específicas

- CLI é a única camada autorizada a chamar `process.exit` ou ler `process.argv`.
- CLI não conhece detalhes de implementação do Crawler — só chama o use case (`crawl-site.usecase.ts`)
  com um `CrawlerConfig` já validado.
- Validação de URL e de args acontece aqui, na borda. Erros de entrada inválida lançam `Error`
  descritivo (ver regra geral de tratamento de erros no `copilot-instructions.md` raiz).
- `crawl-site.usecase.ts` não deve conter lógica de negócio — apenas orquestra a chamada ao
  módulo `Crawler` e traduz o resultado para o formato que a CLI espera exibir.
