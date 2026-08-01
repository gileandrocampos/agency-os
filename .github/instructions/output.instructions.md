---
applyTo: "src/manifest-builder/**,src/filesystem/**"
---

# Output — Manifest e Filesystem

## Módulos cobertos

| Módulo | Localização | Responsabilidade |
|---|---|---|
| ManifestBuilder | `src/manifest-builder/` | Consolida tudo em `site.json` |
| FileSystem | `src/filesystem/index.ts` | Cria diretórios e constrói caminhos de sessão |

## Regras específicas

- `ManifestBuilder` recebe os resultados já prontos de Parser/BrandingExtractor/ContactExtractor/
  MetadataExtractor e apenas monta o objeto final — não deve chamar extractors nem reprocessar HTML.
- `site.json` é o contrato de saída público do projeto. Qualquer mudança na sua forma (campos
  adicionados, removidos ou renomeados) é mudança de contrato: precisa de teste dedicado e de
  atualização no CHANGELOG (regra geral do `copilot-instructions.md` raiz).
- `FileSystem` é o único módulo autorizado a criar diretórios/caminhos em `output/`. Nenhum outro
  módulo deve chamar `fs.mkdir` diretamente — sempre via `FileSystem`.
- Convenção de path de sessão: `output/<domain>_<timestamp>/`. Mudança nesse formato afeta scripts
  externos que leem o output — tratar como mudança de contrato também.
