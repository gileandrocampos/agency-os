# Agency OS

> Ferramenta CLI local para automatizar análises de websites e acelerar a produção de sites modernos para pequenas empresas.

## O que faz

A partir de uma URL, o Freelance OS:

- Captura **screenshot desktop e mobile** da página
- Salva o **HTML completo** renderizado
- Gera um **site.json** tipado com os dados consolidados da página
- Aguarda carregamento de imagens, fontes e idle da rede
- Lida automaticamente com **overlays e banners de cookies**
- Gera logs detalhados de cada etapa

## Tecnologias

- **TypeScript** + Node.js
- **Playwright** — automação de browser
- **Vitest** — testes unitários

## Instalação

```bash
git clone https://github.com/seu-usuario/agency-os.git
cd agency-os
npm install
npx playwright install chromium
```

## Uso

```bash
npm run crawl https://example.com
```

Os arquivos gerados ficam em `output/<dominio>_<timestamp>/`:

```
output/
  example.com_2026-06-29_10-00-00/
    screenshot-desktop.png
    screenshot-mobile.png
    page.html
    site.json
```

Os logs ficam em `logs/`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run crawl <url>` | Executa o crawler |
| `npm run safe-crawl <url>` | Roda os testes antes; aborta se algum falhar |
| `npm test` | Roda os testes |
| `npm run test:coverage` | Roda os testes com cobertura |
| `npm run build` | Compila o TypeScript |

## Arquitetura

```
CLI → Crawler → Page Preparer → Screenshot / HTML Saver → ManifestBuilder
      ↓
    Filesystem + Logger
```

## Roadmap

- [ ] Análise de SEO
- [ ] Integração com IA
- [ ] Geração de wireframe
- [ ] Extração de design system
- [ ] Auditoria de performance

## Licença

MIT
