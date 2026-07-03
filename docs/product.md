# Agency OS

Ferramenta local de linha de comando para automatizar análises de websites.

---

## Objetivo

Reduzir o tempo necessário para reconstrução e auditoria de sites, fornecendo capturas de tela (desktop e mobile) e o HTML renderizado de qualquer URL em um único comando.

---

## Como usar

```bash
# Execução direta
npm run crawl https://example.com

# Execução segura (roda os testes antes de executar o crawler)
npm run safe-crawl https://example.com
```

O resultado é salvo em `output/<domínio>_<timestamp>/`:

| Arquivo                  | Descrição                              |
|--------------------------|----------------------------------------|
| `screenshot-desktop.png` | Captura fullpage em resolução desktop  |
| `screenshot-mobile.png`  | Captura fullpage em resolução mobile   |
| `page.html`              | HTML completo da página após renderização |

Logs de execução são gravados em `logs/execution.log`.

---

## Funcionalidades atuais (v0.1.0 + v0.2.0 parcial)

- Captura de screenshot desktop (1280×720) e mobile (375×812)
- Extração do HTML renderizado
- Preparação de página: dispensa de cookies, remoção de overlays, ativação de lazy load por scroll, espera por rede ociosa, DOM, fontes e imagens
- Validação de URL na entrada da CLI
- Logs com timestamps em arquivo e console
- Execução segura com gate de testes (`safe-crawl`)
- `SiteParser`: extração de title, description, language, headings, paragraphs, links e images (cheerio)
- `MetadataExtractor`: extração de metadados do `<head>` (title, description, keywords, author, viewport, charset, robots, canonical, Open Graph, Twitter Card)

---

## Funcionalidades futuras

- SEO
- IA
- Wireframe
- Design System
- Auditoria