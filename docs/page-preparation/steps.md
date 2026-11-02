> **Resumo**
> Este arquivo descreve os quatro steps principais da preparação, em ordem de execução e com o objetivo de estabilizar a página antes do screenshot.
> Os steps são os pontos de decisão do módulo e centralizam os comportamentos de interação e espera.
> Código: `src/crawler/page-preparer/idle-waiter.ts`, `src/crawler/page-preparer/cookie-handler.ts`, `src/crawler/page-preparer/overlay-handler.ts`, `src/crawler/page-preparer/scroll-activator.ts`.

## Steps

### `IdleWaiter`

Arquivo: `src/crawler/page-preparer/idle-waiter.ts`

Aguarda que a rede fique ociosa pelo tempo configurado em `networkIdleTimeout`. Usado no início e no final da pipeline para garantir que nenhuma requisição assíncrona esteja em andamento no momento de transição.

**Construtor:** `new IdleWaiter(networkIdleTimeout: number)`

---

### `CookieHandler`

Arquivo: `src/crawler/page-preparer/cookie-handler.ts`

Detecta e dispensa banners de consentimento de cookies. Estratégia: identificar botões de aceitação por texto visível ("Accept", "Aceitar", "OK", etc.) ou por seletores semânticos comuns, clicar neles e aguardar o desaparecimento do elemento.

**Ativação:** controlada por `PreparationConfig.cookieDismiss`

---

### `OverlayHandler`

Arquivo: `src/crawler/page-preparer/overlay-handler.ts`

Remove ou fecha modais, pop-ups e overlays que bloqueiam o conteúdo. Estratégia: identificar elementos com `position: fixed` ou `position: absolute` de alta z-index que cobrem parte significativa da viewport, interagir com botões de fechar ou remover via DOM.

**Ativação:** controlada por `PreparationConfig.overlayDismiss`

---

### `ScrollActivator`

Arquivo: `src/crawler/page-preparer/scroll-activator.ts`

Rola a página de cima a baixo em passos para ativar conteúdo com lazy load (imagens, seções, componentes). Após percorrer toda a página, volta ao topo para garantir que o screenshot inicial capture o estado correto do início da página.

**Construtor:** `new ScrollActivator(scrollDelay: number, maxScrollSteps: number)`

| Parâmetro       | Origem na config          | Descrição                                  |
|-----------------|---------------------------|--------------------------------------------|
| `scrollDelay`   | `config.scrollDelay`      | ms de espera entre cada passo de scroll    |
| `maxScrollSteps`| `config.maxScrollSteps`   | Limite de passos para evitar loop infinito |
