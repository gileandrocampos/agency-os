# BrandingExtractor

## Objetivo

O módulo `BrandingExtractor` extrai identidade visual de páginas renderizadas sem IA e sem escrita em disco. Ele analisa apenas dados reais disponíveis no DOM, estilos computados, folhas de estilo e recursos carregados.

---

## Estrutura do módulo

```
src/
  branding-extractor/
    index.ts
    branding-extractor.ts
    types.ts

src/
  __tests__/
    branding-extractor/
      branding-extractor.test.ts
```

### Responsabilidades por arquivo

- `index.ts`
  - Interface pública do módulo
  - Exporta `BrandingExtractorService`, `extractBranding` e tipos públicos

- `types.ts`
  - Contratos tipados da saída
  - Define estrutura estável para logo, paleta, fontes, ícones, framework, tema, componentes, espaçamentos e botões

- `branding-extractor.ts`
  - Implementação da extração
  - Coleta dados com `page.evaluate()` em blocos independentes (logo, favicon, estilos, recursos, componentes e botões)
  - Normaliza e classifica dados em um objeto tipado
  - Loga início/sucesso/falha e propaga erro com contexto

- `branding-extractor.test.ts`
  - Testes unitários do módulo
  - Cobre cenário principal, fallback de logo via favicon e propagação de erro

---

## Contrato de saída

`BrandingExtractionResult` retorna:

- Logo principal + lista de candidatos
- Favicon
- Paleta com `primary`, `secondary`, `accent`, `background`, `surface`, `text`
- Lista completa de cores detectadas
- Fontes com família, pesos e origem
- Biblioteca de ícones detectada
- Framework CSS detectado
- Tema predominante (`light`, `dark`, `mixed`)
- Border radius predominante
- Espaçamentos predominantes
- Componentes visuais encontrados
- Insights de botões (quantidade, classes, estilos e cores)

---

## Desacoplamento e clean architecture

- O módulo não depende de `ManifestBuilder`.
- O módulo não salva arquivos e não grava `site.json`.
- A integração ocorre no `Crawler` por meio de uma chamada explícita para `extractBranding(page)`.
- O retorno é apenas dado tipado, permitindo uso por qualquer consumidor futuro sem acoplamento com persistência.

---

## Expansão futura sem quebrar API

Para manter compatibilidade:

- Novos campos devem ser adicionados de forma aditiva no `BrandingExtractionResult`.
- Regras de extração devem ser encapsuladas em funções privadas do serviço, sem alterar assinatura pública.
- Integrações externas devem consumir o contrato atual e tratar campos desconhecidos como opcionais.

---

## Validação manual

1. Executar crawl real:

```bash
npm run crawl https://example.com
```

2. Validar logs de branding em `logs/execution.log`.

3. Rodar o módulo em páginas com perfis diferentes:
   - site com Bootstrap + Font Awesome
   - site com Tailwind + ícones SVG
   - site sem framework conhecido

4. Confirmar no retorno do crawler:
   - `branding.logo` e `branding.logoCandidates`
   - `branding.palette`
   - `branding.fonts`
   - `branding.iconLibrary`
   - `branding.cssFramework`
   - `branding.theme`
   - `branding.components`
   - `branding.buttons`

5. Executar testes focados:

```bash
npm run test -- src/__tests__/branding-extractor/branding-extractor.test.ts src/__tests__/crawler/index.test.ts
```

---

## Base para próximas funcionalidades

O `BrandingExtractor` fornece a base de dados objetiva para:

- Geração automática de Design System
- Enriquecimento de prompts para IA
- Reconstrução de interfaces com consistência visual

Como o contrato é tipado e desacoplado da persistência, os próximos módulos podem consumir o resultado diretamente sem alterar o pipeline principal.
