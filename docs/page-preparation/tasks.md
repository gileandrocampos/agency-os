> **Resumo**
> Este arquivo reúne as tasks internas usadas pelos steps para estabilizar DOM, fontes e imagens no navegador.
> As tasks encapsulam lógica executada via `page.evaluate()` e servem como blocos reutilizáveis do pipeline.
> Código: `src/crawler/page-preparer/tasks/*.ts`.

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
