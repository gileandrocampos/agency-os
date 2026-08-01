---
applyTo: "src/crawler/**"
---

# Crawler — Orquestração e captura de página

## Módulos cobertos

| Módulo | Localização | Responsabilidade |
|---|---|---|
| Crawler | `src/crawler/index.ts` | Orquestra o fluxo completo de uma sessão |
| Browser | `src/crawler/browser.ts` | Cria e fecha sessão Playwright |
| PageLoader | `src/crawler/page-loader.ts` | Navega para a URL e aguarda `networkidle` |
| PagePreparer | `src/crawler/page-preparer/` | Pipeline de preparação antes da captura |
| Screenshot | `src/crawler/screenshot.ts` | Captura fullpage por viewport |
| HtmlSaver | `src/crawler/html-saver.ts` | Salva HTML renderizado em disco |

## Regras específicas

- `Crawler` (`index.ts`) é o único módulo que conhece a ordem completa do pipeline
  (Browser → PageLoader → PagePreparer → Screenshot → HtmlSaver → Parser). Os demais módulos
  não devem chamar uns aos outros diretamente — sempre via injeção de dependência no orquestrador
  (padrão descrito no `copilot-instructions.md` raiz).
- `Browser` é responsável por garantir que toda sessão Playwright seja fechada, inclusive em caminho de erro
  (`try/finally` ou equivalente). Vazamento de contexto de browser é bug crítico.
- `PagePreparer` segue o padrão de **steps que nunca propagam exceção** — cada step retorna
  `PreparationStepResult` com `success: false` em vez de lançar. Novo step novo = nova função pura
  na pasta `page-preparer/`, registrada no pipeline.
- `Screenshot` e `HtmlSaver` são side-effects puros de I/O — não devem conter lógica de decisão
  sobre *quando* capturar, apenas *como* capturar. Essa decisão pertence ao `Crawler`.
- Qualquer task interna que falhar aqui deve relançar como `Error` com prefixo de contexto
  (ex.: `WaitDomTask failed: ...`), conforme regra geral de erros.
