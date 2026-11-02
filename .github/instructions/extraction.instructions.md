---
description: Regras da camada de parsing e extractors de dados.
applyTo: "src/parser/**,src/branding-extractor/**,src/contact-extractor/**"
---

- Mantenha `src/parser/**` como orquestrador de extração; lógica específica fica nos extractors.
- Em extractors, faça função pura sem I/O de arquivo, rede ou escrita em disco.
- Retorne saída tipada e estável; não retorne estrutura ad hoc.
- Campo não encontrado não é erro: retorne vazio/`undefined` conforme o contrato.
- Trate HTML ausente ou inválido como erro de entrada com mensagem descritiva.
- Em metadata extractor, extraia apenas dados de `<head>`; não infira conteúdo de `<body>`.
- Ao adicionar novo padrão de extração, cubra o formato com teste específico.

Detalhes: docs/parser.md
