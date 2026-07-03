# Instruções de Branching — Agency OS

> Estas regras devem ser seguidas SEMPRE que uma branch, commit ou PR for necessário neste projeto. Não faça suposições diferentes das descritas aqui.

## Contexto

Este arquivo define a convenção oficial de nomenclatura de branches do projeto **Agency OS** e a ação obrigatória que deve ser tomada a partir dela.

**Importante: este documento não é apenas um guia de nomenclatura para consulta ou sugestão. Ele é uma instrução de execução.** Sempre que uma nova feature, correção, refatoração, tarefa de documentação, teste, chore, melhoria de performance, experimento ou hotfix for iniciada neste projeto, o Copilot deve **criar a branch automaticamente**, executando o comando git correspondente — sem esperar que o usuário peça explicitamente “crie uma branch” a cada vez.

> **Quando criar:** após confirmar o objetivo e o escopo da tarefa (conforme passo 3 de `development-workflow.md`). Não criar a branch antes de entender o que será feito.

Use-o como referência obrigatória para:
- **Criar** a branch (ação real, via comando git), não apenas sugerir o nome
- Nomear a branch seguindo o padrão definido abaixo
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

**Ação obrigatória:** definido o objetivo, o tipo e o nome, o Copilot deve criar a branch de fato (`git checkout -b <tipo>/<descricao>`), não apenas informar qual seria o nome ideal.

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

Regra de decisão: se a mudança introduz comportamento novo → `feat`. Se corrige um comportamento quebrado → `fix`. Se muda apenas estrutura interna do código → `refactor`. Na dúvida entre dois tipos, pergunte ao usuário antes de decidir (mas isso não deve ser usado como desculpa para não criar a branch quando o tipo for óbvio).

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

- **Ao identificar que uma nova alteração (feature, correção, refatoração, teste, doc, chore, perf, spike ou hotfix) está prestes a começar, o Copilot deve CRIAR a branch imediatamente e de forma autônoma**, executando o comando git (`git checkout -b <tipo>/<descricao>`) — não deve se limitar a sugerir ou descrever o nome que a branch teria.
- Isso vale mesmo que o usuário não peça explicitamente "crie uma branch": a leitura deste documento já é a autorização e o gatilho para agir.
- Antes de criar a branch, sempre atualizar a `main` local (`git pull origin main`), conforme item 5.1.
- Ao gerar comandos git, usar o formato completo, ex: `git checkout -b feat/seo-analyzer`.
- Se o usuário pedir uma branch sem especificar o tipo, inferir o tipo mais provável com base na descrição da tarefa, criar a branch, e explicar a escolha em uma linha (só perguntar antes de criar se houver ambiguidade real entre dois tipos igualmente plausíveis).
- Nunca sugerir nomes de branch em inglês misturado com português de forma inconsistente — manter a descrição no mesmo idioma da tarefa.
- Nunca criar ou sugerir merge de branch `spike/*` para `main` sem mencionar que precisa de revisão humana antes.
- Nunca criar ou fazer commit diretamente na `main`.