> **Resumo**
> Este subarquivo contextualiza o módulo de preparação e mostra por que ele existe e onde está no projeto.
> É a entrada do conjunto: define o problema que a preparação resolve e a organização por arquivos.
> Código: `src/crawler/page-preparer/**` e `src/types/preparation.ts`.

# Page Preparer

Módulo responsável por preparar uma página web antes da captura de screenshots e extração de HTML. Garante que o conteúdo visual esteja completamente renderizado — fontes carregadas, imagens visíveis, banners de cookie e overlays removidos, e conteúdo lazy-load ativado por scroll.

---

## Por que existe

Páginas reais raramente estão "prontas" logo após o carregamento inicial. Problemas comuns:

- Banners de consentimento de cookies bloqueando o conteúdo
- Modais e overlays de marketing cobrindo o layout
- Imagens e seções que só carregam quando o usuário rola a página (lazy load)
- Fontes web ainda sendo baixadas no momento da captura
- Requisições assíncronas (API calls, animações) em andamento

Sem preparação, screenshots capturam a página em estado intermediário, comprometendo a análise visual.

---

## Localização no projeto

```
src/
└── crawler/
    └── page-preparer/
        ├── index.ts           ← orquestrador principal (PagePreparationService)
        ├── cookie-handler.ts  ← step: dispensa banners de cookie
        ├── idle-waiter.ts     ← step: aguarda rede ociosa
        ├── overlay-handler.ts ← step: remove overlays e modais
        ├── scroll-activator.ts← step: scroll para ativar lazy load
        └── tasks/
            ├── wait-dom.ts    ← task: aguarda DOM estabilizar
            ├── wait-fonts.ts  ← task: aguarda fontes web carregar
            └── wait-images.ts ← task: aguarda imagens carregar
src/
└── types/
    └── preparation.ts         ← tipos e contratos do módulo
```
