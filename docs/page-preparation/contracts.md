> **Resumo**
> Este arquivo documenta os tipos compartilhados e a classe central que monta a pipeline de preparação.
> É o ponto de leitura para validar o contrato de entrada e a ordem de execução dos steps.
> Código: `src/types/preparation.ts` e `src/crawler/page-preparer/index.ts`.

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
