# ContactExtractor

## Objetivo

Extrair dados de contato disponíveis na página renderizada sem dependência de IA e sem escrita em disco.

O módulo usa apenas:
- HTML renderizado (`page.content()`)
- URLs e recursos já presentes no DOM (links, iframes, scripts, dados estruturados)

---

## Estrutura

```
src/
  contact-extractor/
    index.ts
    types.ts
    contact-extractor.ts

src/
  __tests__/
    contact-extractor/
      contact-extractor.test.ts
```

---

## Contrato público

### `extractContacts(input: ContactExtractorInput): ContactExtractionResult`

Recebe:
- `html`: HTML renderizado
- `baseUrl?`: URL base para resolver links relativos

Retorna:
- `phones`
- `whatsapp`
- `emails`
- `addresses`
- `socialProfiles`
- `maps`
- `businessHours`
- `forms`
- `ctas`
- `branches`

Todos os arrays retornam dados normalizados e deduplicados.

---

## Regras de extração

### Telefones
- Links `tel:`
- Padrões de número no texto da página
- Normalização para formato internacional quando possível

### WhatsApp
- Links `wa.me`, `api.whatsapp.com`, `whatsapp.com`
- Extração de número do link
- Geração de link provável a partir de telefones detectados

### E-mails
- Links `mailto:`
- Padrões de e-mail no texto

### Endereço
- Prioridade para `application/ld+json` (`LocalBusiness`/`PostalAddress`)
- Fallback em rodapé e seções de contato
- Referências de mapa entram como evidência complementar

### Redes sociais
- Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest, X, Threads, Behance e GitHub

### Google Maps
- Links e embeds para domínios de Google Maps
- Tentativa de extração de coordenadas no próprio URL

### Horários
- `openingHours` em Schema.org
- Padrões textuais comuns em português

### Formulários
- Quantidade de formulários
- `action`, método HTTP, campos obrigatórios
- Presença de CAPTCHA

### CTAs de contato
- Botões/links com textos como:
  - `Solicite orçamento`
  - `Fale conosco`
  - `Agende uma visita`

### Múltiplas unidades
- Heurística por múltiplos endereços e termos como `filial`, `unidade`, `matriz`

---

## Integração

- O crawler chama `extractContacts` após obter o HTML renderizado.
- O `ManifestBuilder` consome o resultado em `content.contact`.
- O módulo não cria diretórios, não grava arquivos e não escreve `site.json`.

---

## Extensibilidade

O contrato foi projetado para adição incremental de novas fontes sem quebra de compatibilidade:
- novos campos opcionais
- novas heurísticas por canal
- conectores futuros para Google Maps API, CRM e automação comercial
