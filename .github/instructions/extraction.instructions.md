---
applyTo: "src/parser/**,src/branding-extractor/**,src/contact-extractor/**"
---

# Extração — Parser, Branding, Contatos, Metadados

## Módulos cobertos

| Módulo | Localização | Responsabilidade |
|---|---|---|
| Parser | `src/parser/index.ts` | Extrai dados estruturados do HTML |
| BrandingExtractor | `src/branding-extractor/` | Logo, cores, fontes, tema, componentes |
| ContactExtractor | `src/contact-extractor/` | Telefone, WhatsApp, e-mail, endereço, redes sociais |
| MetadataExtractor | `src/parser/metadata-extractor.ts` | Metadados do `<head>` |

## Regras específicas

- `Parser` é o orquestrador desta camada: recebe o HTML já capturado e delega a cada extractor
  especializado (Branding, Contact, Metadata). Não deve conter regex ou lógica de parsing própria —
  isso pertence aos extractors.
- Cada extractor é uma função pura: entrada = HTML (ou DOM já parseado) + config opcional,
  saída = objeto tipado. Nada de I/O (sem leitura de arquivo, sem rede) dentro dos extractors.
- Falha em extrair um campo específico (ex.: não achou WhatsApp) **não é erro** — retorne
  `undefined`/campo vazio no objeto de saída. Erro de verdade é HTML malformado ou ausente,
  que segue a regra geral de erros do `copilot-instructions.md` raiz.
- Padrões de contato (telefone, e-mail, WhatsApp) e de branding (extração de cor/fonte) tendem a
  ter muitos edge cases — todo novo padrão suportado exige teste cobrindo o formato específico
  (não basta cobrir o "happy path" genérico).
- `MetadataExtractor` cobre apenas o que está em `<head>` (title, meta tags, OpenGraph, etc.);
  não deve inferir dados do `<body>` — isso é responsabilidade de Branding/Contact.
