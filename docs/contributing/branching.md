# Instruções de Branching — Agency OS

> Estas regras devem ser seguidas SEMPRE que uma branch, commit ou PR for criado, sugerido ou mencionado neste projeto. Não faça suposições diferentes das descritas aqui.

## Contexto

Este arquivo define a convenção oficial de nomenclatura de branches do projeto **Agency OS**. Use-o como referência obrigatória ao:
- Sugerir o nome de uma nova branch
- Criar uma branch via terminal/comando
- Revisar se uma branch existente segue o padrão
- Gerar mensagens de commit ou descrições de PR relacionadas ao tipo da branch

---

## 1. Branch principal

- `main` é sempre uma versão estável e "deployável" do projeto.
- **NUNCA** sugira ou faça commits diretamente na `main`.
- Toda alteração passa por uma branch específica + Pull Request.

---

## 2. Regra geral de nomenclatura

```
<tipo>/<descricao-kebab-case>
```

- `<tipo>`: um dos tipos definidos na tabela abaixo (sempre em minúsculo).
- `<descricao-kebab-case>`: minúsculo, palavras separadas por hífen, sem acentos, sem espaços, sem underscores. Deve ser curta e descrever o objetivo (2 a 5 palavras).
- Não usar maiúsculas, `_`, espaços, acentos ou caracteres especiais no nome da branch.
- Se a mudança estiver ligada a uma issue/ticket, incluir o número ao final: `feat/seo-analyzer-123`.

---

## 3. Tabela de tipos

| Tipo       | Quando usar                                              | Exemplos                                                      |
|------------|-----------------------------------------------------------|-----------------------------------------------------------------|
| `feat`     | Nova funcionalidade                                        | `feat/page-preparation`, `feat/parser-html`, `feat/seo-analyzer` |
| `fix`      | Correção de bug                                            | `fix/logger-crash`, `fix/mobile-screenshot`, `fix/playwright-timeout` |
| `refactor` | Refatoração sem mudança de comportamento externo           | `refactor/logger-service`, `refactor/crawler-pipeline`         |
| `docs`     | Alterações apenas de documentação                          | `docs/testing-guide`, `docs/architecture-update`                |
| `test`     | Criação ou ajuste de testes                                 | `test/page-preparation`, `test/crawler`                         |
| `chore`    | Tarefas de manutenção (deps, configs, build, CI)            | `chore/update-deps`, `chore/ci-pipeline`                        |
| `perf`     | Melhoria de performance sem mudar funcionalidade             | `perf/crawler-memory-usage`                                    |
| `spike`    | Experimentação/prova de conceito                             | `spike/new-parser-lib`, `spike/ai-classifier`                   |
| `hotfix`   | Correção urgente relacionada diretamente à produção           | `hotfix/prod-crash-login`                                       |

Regra de decisão: se a mudança introduz comportamento novo → `feat`. Se corrige um comportamento quebrado → `fix`. Se muda apenas estrutura interna do código → `refactor`. Na dúvida entre dois tipos, pergunte ao usuário antes de decidir.

---

## 4. Regras específicas por tipo

### 4.1 Feature (`feat/`)
- Sempre criada a partir da `main` atualizada.
- Deve conter apenas o escopo da funcionalidade descrita no nome.

### 4.2 Correção (`fix/`)
- Criada a partir da `main` (ou da branch de release, se houver).
- A descrição deve indicar o sintoma ou componente afetado, não a causa técnica.

### 4.3 Refatoração (`refactor/`)
- Não deve alterar comportamento observável do sistema.
- Não deve misturar refatoração com novas funcionalidades ou correções na mesma branch.

### 4.4 Documentação (`docs/`)
- Reservada exclusivamente para arquivos `.md`, comentários de arquitetura, guias e afins.
- Não deve conter alteração de código de produção.

### 4.5 Testes (`test/`)
- Usada quando o objetivo principal é adicionar/ajustar testes, sem alterar lógica de produção.

### 4.6 Experimental (`spike/`)
- Usada para validar ideias/hipóteses técnicas.
- **NUNCA** deve receber merge direto para `main` sem revisão explícita e aprovação humana.
- Pode ser descartada sem aviso caso a ideia não avance.

### 4.7 Hotfix (`hotfix/`)
- Usada apenas para correções urgentes em produção.
- Deve ser mesclada com prioridade máxima e, se aplicável, replicada para outras branches ativas.

---

## 5. Boas práticas obrigatórias

1. Sempre atualizar a `main` local antes de criar uma nova branch (`git pull origin main`).
2. Uma branch = um objetivo. Evitar branches que misturem tipos diferentes (ex: feature + refactor).
3. Nome da branch deve ser autoexplicativo — quem ler deve entender o que ela faz sem abrir o código.
4. Ao final do trabalho, abrir Pull Request para `main` com descrição clara do que foi feito.
5. Excluir a branch após o merge, para manter o repositório limpo.

---

## 6. Como o Copilot deve se comportar

- Ao sugerir a criação de uma branch, **sempre** seguir o padrão `<tipo>/<descricao-kebab-case>` desta tabela.
- Ao gerar comandos git, usar o formato completo, ex: `git checkout -b feat/seo-analyzer`.
- Se o usuário pedir uma branch sem especificar o tipo, perguntar ou inferir o tipo mais provável com base na descrição da tarefa, e explicar a escolha em uma linha.
- Nunca sugerir nomes de branch em inglês misturado com português de forma inconsistente — manter a descrição no mesmo idioma da tarefa.
- Nunca sugerir merge de branch `spike/*` sem mencionar que precisa de revisão humana antes.