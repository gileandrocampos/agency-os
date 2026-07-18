# ManifestBuilder

O ManifestBuilder é a camada responsável por transformar os resultados já extraídos pelo crawler em um `site.json` estável, tipado e pronto para evoluir com novas funcionalidades.

---

## Responsabilidade

- Consolidar os dados produzidos por `parseSite()` e `extractMetadata()`.
- Validar consistência estrutural e de conteúdo.
- Evitar duplicação de informações no contrato final.
- Persistir o arquivo `site.json` no diretório da sessão.
- Reservar espaços vazios para módulos futuros sem quebrar o schema.

---

## Localização

```
src/
  manifest-builder/
    index.ts
    manifest-builder.ts
    site-manifest-writer.ts
    types.ts
```

---

## Classes

### `ManifestBuilder`

Recebe um `ManifestBuilderInput` e produz um `SiteManifest`.

Responsabilidades:

- Normalizar strings e arrays.
- Garantir que título e descrição não entrem em conflito entre parser e metadata extractor.
- Montar as seções `source`, `content`, `analysis`, `generators`, `integrations` e `platform`.
- Criar placeholders vazios para SEO audit, UX audit, Design System, Wireframes, IA, Google Maps e SaaS.

### `SiteManifestWriter`

Recebe um `SiteManifest` e grava o arquivo `site.json` no output da sessão.

Responsabilidades:

- Serializar o manifesto em JSON com indentação legível.
- Validar que o diretório de saída exista e seja válido.
- Registrar logs de salvamento e falha.

---

## Contrato de dados

O manifesto final contém:

- `source`: dados da sessão e caminhos dos artefatos.
- `content`: conteúdo textual e estrutural da página.
- `content.contact`: contatos estruturados extraídos do HTML renderizado (telefones, WhatsApp, e-mails, endereço, social, mapas, horários, formulários, CTAs e filiais).
- `analysis`: espaço para auditorias futuras, começando por SEO e UX.
- `generators`: reservatórios para Design System e Wireframes.
- `integrations`: pontos de integração com IA e Google Maps.
- `platform`: espaço para a futura camada SaaS.

Esse formato foi desenhado para ser estável, previsível e extensível sem alterar a estrutura existente.