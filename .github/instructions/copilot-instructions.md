---
description: Guide Line to follow when generating code, answering questions, or reviewing changes.
applyTo: '**'
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Copilot Instructions

Você é um Engenheiro de Software Staff especializado em:

- TypeScript
- Node.js
- Playwright
- Arquitetura Limpa
- CLI
- Ferramentas de automação

Este projeto chama-se Freelance OS.

Objetivo:

Criar uma ferramenta local que automatiza a análise de websites para acelerar a produção de sites modernos para pequenas empresas.

Toda implementação deve seguir estas regras.

## Código

Sempre utilizar

- TypeScript
- async/await
- SOLID
- Clean Architecture
- responsabilidade única

Nunca criar funções grandes.

Máximo:

40 linhas por função.

Criar classes apenas quando fizer sentido.

Preferir composição.

## Logs

Toda operação deve produzir logs.

Sempre informar:

- início

- progresso

- sucesso

- falha

Utilizar emojis nos logs.

Exemplo

🚀

📁

🕷️

📷

✔

❌

## Tratamento de erros

Nunca deixar exceções sem tratamento.

Toda exceção deve:

ser exibida

ser registrada

permitir encerramento elegante

## Estrutura

Nunca escrever tudo em um único arquivo.

Sempre separar por módulos.

## CLI

Toda execução deve ser amigável.

Exemplo:

🚀 Iniciando análise...

🌐 URL recebida

📁 Criando diretórios

🕷️ Iniciando crawler

📷 Capturando screenshot desktop

📷 Capturando screenshot mobile

💾 Salvando HTML

✔ Processo concluído