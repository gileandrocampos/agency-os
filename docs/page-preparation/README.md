> **Resumo**
> Este módulo prepara a página web antes da captura de screenshots e da extração de HTML.
> Entradas: `Page` do Playwright e `PreparationConfig` com regras de cookie, overlay e lazy load.
> Saídas: resultado consolidado da preparação com steps executados, warnings e estado final da página.
> Dependências: `src/crawler/page-preparer/**`, `src/types/preparation.ts` e integração com o fluxo do crawler.
> Código: `src/crawler/page-preparer/**`, `src/types/preparation.ts`.

# Page Preparation

## Índice

| Arquivo | O que contém | Quando ler |
|----------|--------------|------------|
| [overview.md](./overview.md) | Contexto do módulo, por que ele existe e onde fica no projeto | Para entender o problema que a preparação resolve |
| [contracts.md](./contracts.md) | Tipos, contratos e orquestrador principal | Para revisar a API do módulo e a sequência de execução |
| [steps.md](./steps.md) | Passos de preparação (`IdleWaiter`, `CookieHandler`, `OverlayHandler`, `ScrollActivator`) | Para compreender cada etapa e sua finalidade |
| [tasks.md](./tasks.md) | Tasks internas usadas via `page.evaluate()` | Para validar como o DOM, fontes e imagens são aguardados |
| [runtime.md](./runtime.md) | Fluxo completo, configuração default, utilitários e status de implementação | Para confirmar o pipeline end-to-end e o estado da implementação |
