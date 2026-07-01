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

---

## Tipos e Contratos

Arquivo: `src/types/preparation.ts`

### `PreparationConfig`

Configuração que controla quais etapas são executadas e seus parâmetros.

| Propriedade          | Tipo       | Padrão  | Descrição                                              |
|----------------------|------------|---------|--------------------------------------------------------|
| `cookieDismiss`      | `boolean`  | `true`  | Ativa o step de dispensa de banners de cookie          |
| `overlayDismiss`     | `boolean`  | `true`  | Ativa o step de remoção de overlays e modais           |
| `scrollActivation`   | `boolean`  | `true`  | Ativa o step de scroll para trigger de lazy load       |
| `scrollDelay`        | `number`   | `300`   | Intervalo entre passos de scroll em milissegundos      |
| `maxScrollSteps`     | `number`   | `20`    | Número máximo de passos de scroll descendente          |
| `networkIdleTimeout` | `number`   | `5000`  | Tempo máximo de espera por rede ociosa em ms           |
| `waitForSelectors`   | `string[]` | —       | (Opcional) Seletores CSS a aguardar antes de prosseguir|

### `PreparationStep` (interface)

Contrato que todo step deve implementar.

```typescript
interface PreparationStep {
  readonly name: string;
  run(page: Page): Promise<PreparationStepResult>;
}
```

### `PreparationStepResult`

Resultado retornado por cada step após execução.

| Propriedade  | Tipo      | Descrição                                    |
|--------------|-----------|----------------------------------------------|
| `name`       | `string`  | Identificador do step                        |
| `executed`   | `boolean` | Se o step foi realmente executado            |
| `success`    | `boolean` | Se o step concluiu sem erros                 |
| `durationMs` | `number`  | Tempo de execução em milissegundos           |
| `detail`     | `string?` | Mensagem opcional (ex: motivo de skip/falha) |

### `PreparationResult`

Resultado agregado de toda a pipeline.

| Propriedade       | Tipo                     | Descrição                             |
|-------------------|--------------------------|---------------------------------------|
| `success`         | `boolean`                | Se todos os steps críticos passaram   |
| `totalDurationMs` | `number`                 | Duração total da preparação em ms     |
| `steps`           | `PreparationStepResult[]`| Resultados individuais de cada step   |
| `warnings`        | `string[]`               | Avisos não fatais acumulados          |

---

## Orquestrador: `PagePreparationService`

Arquivo: `src/crawler/page-preparer/index.ts`

Classe central que monta e executa a pipeline de preparação. Recebe uma `PreparationConfig` (ou usa o `DEFAULT_PREPARATION_CONFIG`) e constrói a sequência de steps no construtor via `buildSteps()`.

### Pipeline de execução

A ordem dos steps é fixa e determinística:

```
1. IdleWaiter        ← aguarda rede estabilizar após carregamento inicial
2. CookieHandler     ← (se cookieDismiss = true) fecha banners de cookie
3. OverlayHandler    ← (se overlayDismiss = true) remove modais e overlays
4. ScrollActivator   ← (se scrollActivation = true) rola página para ativar lazy load
5. IdleWaiter        ← aguarda rede estabilizar novamente após interações
```

O segundo `IdleWaiter` no final da pipeline é intencional: interações como fechar um banner ou acionar scroll podem disparar novas requisições de rede. Aguardar de novo garante que todos os efeitos colaterais se resolvam antes da captura.

### `prepare(page: Page): Promise<PreparationResult>`

Método público que executa todos os steps em sequência e retorna o `PreparationResult` consolidado.

---

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

---

## Tasks (utilitários internos)

Tasks são classes auxiliares que encapsulam operações executadas via `page.evaluate()` (código rodando dentro do browser). São usadas pelos steps como blocos de lógica reutilizável.

---

### `WaitDomTask`

Arquivo: `src/crawler/page-preparer/tasks/wait-dom.ts`

Aguarda o DOM estabilizar usando `MutationObserver`. Considera o DOM "estável" quando nenhuma mutação ocorre por `idleMs` milissegundos consecutivos.

**Opções:**

| Opção       | Padrão | Descrição                                          |
|-------------|--------|----------------------------------------------------|
| `idleMs`    | `500`  | Silêncio de mutações necessário para resolver      |
| `timeoutMs` | `5000` | Timeout de segurança — resolve mesmo sem estabilizar|

**Funcionamento interno:**

```
MutationObserver observa document.body (subtree, childList, attributes)
  ↓ cada mutação reinicia o timer idle
  ↓ quando idle timer dispara sem nova mutação → resolve
  ↓ safety timer dispara em timeoutMs → resolve (fallback)
```

O guard `settled` garante que `resolveOnce` seja invocado apenas uma vez, mesmo que o idle timer e o safety timer disparem no mesmo tick do event loop.

---

### `WaitFontsTask`

Arquivo: `src/crawler/page-preparer/tasks/wait-fonts.ts`

Aguarda que todas as fontes web registradas na página terminem de carregar usando a API nativa `document.fonts.ready`.

**Opções:**

| Opção       | Padrão  | Descrição                                       |
|-------------|---------|-----------------------------------------------------|
| `timeoutMs` | `10000` | Timeout de segurança caso `fonts.ready` não resolva |

**Funcionamento:**

```typescript
Promise.race([
  document.fonts.ready,  // resolve quando todas as fontes estão prontas
  timeout(timeoutMs)     // fallback para evitar travamento
])
```

Qualquer rejeição de `document.fonts.ready` é propagada para o `try/catch` em `run()`.

---

### `WaitImagesTask`

Arquivo: `src/crawler/page-preparer/tasks/wait-images.ts`

Aguarda que todos os elementos `img[src]` da página terminem de carregar (ou falharem). Imagens quebradas também são consideradas "resolvidas" para não bloquear a pipeline.

**Opções:**

| Opção       | Padrão  | Descrição                                         |
|-------------|---------|---------------------------------------------------|
| `timeoutMs` | `15000` | Timeout de segurança para imagens lentas          |

**Funcionamento:**

```typescript
// Para cada <img src="...">:
if (img.complete) resolve()           // já carregada → ok imediato
img.on('load', resolve)               // carregou → ok
img.on('error', resolve)              // falhou → também ok (não bloqueia)

// Aguarda todas:
Promise.race([
  Promise.all(images.map(waitForImage)),  // todas resolvidas
  timeout(timeoutMs)                      // fallback de segurança
])
```

O `timeoutMs` de 15 segundos é o maior dos três tasks porque imagens externas podem ser lentas em redes reais.

---

## Fluxo completo

```
runCrawler(url)
  └─ loadPage(page, url)           ← página carregada pelo Playwright
       └─ PagePreparationService.prepare(page)
            ├─ IdleWaiter.run()         → rede estável pós-carregamento
            ├─ CookieHandler.run()      → banner de cookie dispensado
            ├─ OverlayHandler.run()     → overlays removidos
            ├─ ScrollActivator.run()    → lazy load ativado por scroll
            └─ IdleWaiter.run()         → rede estável pós-interações
  └─ captureScreenshot(desktop)
  └─ captureScreenshot(mobile)
  └─ saveHtml()
```

---

## Configuração padrão

```typescript
const DEFAULT_PREPARATION_CONFIG: PreparationConfig = {
  cookieDismiss: true,
  overlayDismiss: true,
  scrollActivation: true,
  scrollDelay: 300,       // ms entre passos de scroll
  maxScrollSteps: 20,     // máximo 20 passos de scroll
  networkIdleTimeout: 5000, // 5s aguardando rede ociosa
};
```

---

## Utilitário: `clickFirstMatch`

Arquivo: `src/crawler/page-preparer/click-first-match.ts`

Função compartilhada usada por `CookieHandler` e `OverlayHandler`. Itera sobre uma lista de seletores CSS e tenta clicar no primeiro que for encontrado na página.

**Assinatura:**

```typescript
clickFirstMatch(
  page: Page,
  selectors: readonly string[],
  timeoutMs = SELECTOR_CLICK_TIMEOUT_MS, // padrão: 2000ms
): Promise<string | null>
```

Retorna o seletor que foi clicado com sucesso, ou `null` se nenhum for encontrado. Falhas individuais de seletor são silenciadas — a função tenta o próximo da lista.

---

## Status de implementação

| Componente              | Status       |
|-------------------------|--------------|
| `PagePreparationService`| ✅ Implementado |
| `IdleWaiter`            | ✅ Implementado |
| `CookieHandler`         | ✅ Implementado |
| `OverlayHandler`        | ✅ Implementado |
| `ScrollActivator`       | ✅ Implementado |
| `WaitDomTask`           | ✅ Implementado |
| `WaitFontsTask`         | ✅ Implementado |
| `WaitImagesTask`        | ✅ Implementado |
| `clickFirstMatch`       | ✅ Implementado |
| `WaitFontsTask`         | ✅ Implementado                 |
| `WaitImagesTask`        | ✅ Implementado                 |
| Tipos (`preparation.ts`)| ✅ Implementado                 |

Os steps da pipeline têm estrutura, contratos e configuração definidos, mas os corpos dos métodos `run()` ainda lançam `Error('Not implemented')`. As tasks internas (`WaitDomTask`, `WaitFontsTask`, `WaitImagesTask`) estão completamente implementadas e prontas para uso pelos steps.
