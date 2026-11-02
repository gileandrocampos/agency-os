---
description: Regras de construção e persistência de saída da sessão.
applyTo: "src/manifest-builder/**,src/filesystem/**"
---

- Em `src/manifest-builder/**`, apenas monte o manifesto com dados já extraídos.
- Não chame extractors nem reprocesse HTML dentro de manifest builder.
- Trate `site.json` como contrato público: mudança de shape exige testes e atualização de documentação.
- Concentre criação de diretório e path de sessão em `src/filesystem/**`.
- Não crie paths de `output/` diretamente fora de `src/filesystem/**`.
- Preserve o formato `output/<domain>_<timestamp>/` salvo decisão explícita de mudança de contrato.

Detalhes: docs/manifest-builder.md
