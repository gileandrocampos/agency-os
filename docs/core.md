# Core

> **Resumo**
> Este documento consolida os módulos compartilhados e estáveis da base.
> Escopo: `config`, `logger`, `types`, `utils` e `filesystem`.
> O foco aqui é o contrato público e o comportamento observado no código atual.
> Não descreve módulos de crawl, parser ou fila.

## Contratos

- `src/config/index.ts` exporta `JsonFileConfigService`, `GLOBAL_CONFIG_SCHEMA` e tipos de configuração.
- `GlobalConfigService` define duas operações: `read()` e `write(config)`.
- `GLOBAL_CONFIG_SCHEMA` define defaults para `storage.logsDir`, `storage.outputDir`, `retry.maxAttempts` e `retry.backoffMs`.
- `src/logger/index.ts` expõe funções de log por contexto (`logStart`, `logQueue`, `logError` etc.), além de `initLogger` e `setSilent`.
- `src/types/index.ts` concentra tipos compartilhados do resultado do crawler (`CrawlerConfig`, `CrawlerResult`) e viewports padrão.
- `src/types/preparation.ts` define o contrato de preparação de página (`PreparationConfig`, `PreparationResult`, `PreparationStep`).
- `src/utils/url-validator.ts` expõe `validateUrl(input)` e `extractDomain(url)`.
- `src/utils/time.ts` expõe `generateTimestamp()` no formato `YYYY-MM-DD_HH-MM-SS`.
- `src/filesystem/index.ts` expõe `ensureDir(dirPath)` e `buildSessionDir(outputBase, domain, timestamp)`.

## Fluxo

1. Configuração global é lida por `JsonFileConfigService.read()`.
2. Se `config.json` não existir, o serviço gera defaults via schema e persiste o arquivo.
3. Em `write()`, o patch recebido é mesclado de forma profunda com o estado atual, normalizado e validado.
4. `logger` mantém estado interno (`logFilePath`, `silent`) e grava linhas com timestamp no console e/ou arquivo.
5. `utils` e `filesystem` atuam como utilitários puros/sincronizados para URL, timestamp e caminhos de sessão.

## Decisões de design

- Schema de configuração aceita propriedades adicionais (`additionalProperties: true`) nos blocos principais.
- Normalização e validação são separadas (`normalizeWithSchema` e `validateWithSchema`).
- `logger` usa API funcional (sem classe), com estado de módulo encapsulado.
- `logQueue` ignora modo silencioso para garantir visibilidade de processamento de fila.
- Tipos de preparação foram centralizados em `src/types/preparation.ts` para reuso entre implementação e testes.

## Casos de borda

- JSON inválido em `config.json` gera erro descritivo (`Arquivo de configuração inválido...`).
- Valores com tipo incorreto no config geram erro com caminho do campo (`$.retry.maxAttempts`, por exemplo).
- Chaves não previstas só são rejeitadas quando um nó do schema usar `additionalProperties: false`.
- `validateUrl` rejeita protocolos fora de `http`/`https` e strings que não formam URL válida.
- `extractDomain` remove apenas prefixo `www.`; outros subdomínios são preservados.
- `initLogger` apenas define o caminho do log; criação de diretório/arquivo fica A CONFIRMAR no fluxo de bootstrap externo.
