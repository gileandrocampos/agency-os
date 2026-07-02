---
name: feature-crawler.md
description: Criar uma ferramenta local que automatiza a análise de websites para acelerar a produção de sites modernos para pequenas empresas.
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

# Feature

Implementar a versão v0.1 do módulo Crawler.

Objetivo:

Receber uma URL pela linha de comando e gerar uma estrutura inicial de análise.

Requisitos:

- Utilizar TypeScript
- Utilizar Playwright
- Utilizar arquitetura modular
- Utilizar Node.js
- Utilizar async/await
- Não utilizar variáveis globais
- Não utilizar código duplicado

Fluxo esperado:

1. Receber URL.

2. Validar URL.

3. Criar estrutura de diretórios automaticamente.

4. Iniciar Playwright.

5. Abrir a página.

6. Esperar carregamento completo.

7. Capturar screenshot Desktop.

8. Alterar viewport.

9. Capturar screenshot Mobile.

10. Salvar HTML completo.

11. Encerrar navegador.

12. Registrar logs.

13. Gerar arquivo execution.log.

Logs esperados:

🚀 Iniciando análise

🌐 Validando URL

📁 Criando diretórios

🕷️ Abrindo navegador

🌐 Carregando página

📷 Capturando Desktop

📷 Capturando Mobile

💾 Salvando HTML

✔ Processo concluído

Caso ocorra erro:

❌ Mostrar erro amigável

Registrar stack trace no arquivo execution.log

Estrutura esperada:

src

cli

crawler

logger

filesystem

types

utils

output

logs

O código deve ser organizado para facilitar futuras implementações como:

SEO

Parser

IA

Wireframe

Design System

Não implementar funcionalidades futuras.

Implementar apenas a infraestrutura necessária para o Crawler.

Sempre priorizar legibilidade e manutenção.