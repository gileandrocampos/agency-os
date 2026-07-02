# Instruções de Development Workflow — Agency OS

> Estas regras devem ser seguidas SEMPRE que uma nova ideia, tarefa, alteração ou correção for iniciada neste projeto. O Copilot deve usar este fluxo como checklist obrigatório do início ao fim do trabalho, sem pular etapas, mesmo que o usuário peça apenas "implementar X".

## Contexto

Este arquivo define o **fluxo de desenvolvimento oficial** do projeto **Agency OS**. Ele complementa o arquivo `docs/contributing/branching.md` (convenção de nomes de branch) e deve ser aplicado em conjunto com ele.

Fluxo completo:

```
Nova ideia
   ↓
Criar Issue (futuramente)
   ↓
Criar Branch
   ↓
Implementar
   ↓
Criar Testes
   ↓
Atualizar Documentação
   ↓
Executar Safe-Crawl
   ↓
Merge
   ↓
Excluir Branch
```

---

## 1. Nova ideia

- Toda alteração começa com uma ideia/necessidade clara: bug, funcionalidade, refatoração, etc.
- Antes de qualquer código, o Copilot deve garantir que entendeu o **objetivo** e o **escopo** da mudança. Se a tarefa for ambígua, deve perguntar antes de prosseguir.
- Nenhuma linha de código é escrita nesta etapa.

---

## 2. Criar Issue (futuramente)

- Etapa reservada para quando o projeto adotar rastreamento formal de issues (GitHub Issues, Linear, Jira, etc.).
- Enquanto não estiver ativa, o Copilot deve **pular** esta etapa silenciosamente, sem bloquear o fluxo, mas pode sugerir um resumo em formato de issue (título + descrição) para facilitar a criação futura, se fizer sentido.
- Quando esta etapa for ativada, cada branch deve referenciar o número da issue correspondente (ex: `feat/seo-analyzer-123`).

---

## 3. Criar Branch

- Seguir **obrigatoriamente** a convenção definida em `branching.md`: `<tipo>/<descricao-kebab-case>`.
- Sempre partir da `main` atualizada (`git pull origin main` antes de criar a branch).
- Uma branch = um objetivo. Não iniciar implementação sem antes garantir que a branch correta foi criada.

---

## 4. Implementar

- O código deve ficar restrito ao escopo definido na etapa "Nova ideia". Mudanças fora do escopo devem ser sinalizadas ao usuário, não feitas silenciosamente.
- Seguir os padrões de código, arquitetura e convenções já existentes no projeto (nomenclatura, estrutura de pastas, estilo).
- Commits pequenos e descritivos ao longo da implementação, em vez de um único commit gigante no final.
- Não avançar para a próxima etapa sem a funcionalidade/correção estar funcional localmente.

---

## 5. Criar Testes

- Toda implementação (`feat`, `fix`, `refactor`) deve vir acompanhada de testes correspondentes, cobrindo:
  - Caso principal (happy path)
  - Casos de erro/borda relevantes
  - Regressão, no caso de `fix` (o teste deve falhar sem a correção e passar com ela)
- Branches `docs/*` estão isentas desta etapa.
- Se o projeto não tiver testes para a área tocada, o Copilot deve sugerir a criação da estrutura mínima de testes antes de prosseguir.
- **Não avançar para a próxima etapa se os testes não estiverem passando.**

---

## 6. Atualizar Documentação

- Sempre revisar se a mudança impacta:
  - README do projeto ou do módulo
  - Documentação de arquitetura
  - Comentários/JSDoc de funções públicas alteradas
  - Guias de uso (ex: `docs/*`)
- Se a mudança não impacta documentação, o Copilot deve declarar isso explicitamente ("nenhuma documentação precisa ser atualizada"), em vez de simplesmente pular a etapa sem mencionar.

---

## 7. Executar Safe-Crawl

- Etapa de validação específica do Agency OS: rodar o processo de **safe-crawl** antes do merge, para garantir que a mudança não quebra o pipeline de crawling/parsing em produção.
- O Copilot deve lembrar o usuário de executar esta etapa e, se possível, sugerir o comando/script correspondente do projeto.
- **Nenhum merge deve ser sugerido ou realizado sem o safe-crawl ter sido executado com sucesso.**
- Se o safe-crawl falhar, o fluxo retorna para a etapa "Implementar" — não avançar para merge com falhas conhecidas.

---

## 8. Merge

- Só deve ocorrer após: testes passando + documentação atualizada + safe-crawl aprovado.
- O merge é feito via **Pull Request** para a `main`, nunca por push direto.
- Descrição do PR deve conter: objetivo da mudança, tipo (`feat`/`fix`/`refactor`/etc.), como testar, e riscos conhecidos, se houver.
- Branches `spike/*` **nunca** são mescladas sem revisão humana explícita, independentemente de terem passado pelas etapas anteriores.

---

## 9. Excluir Branch

- Após o merge confirmado, a branch local e remota devem ser excluídas.
- Manter o repositório limpo é parte do fluxo, não uma etapa opcional.

---

## 10. Como o Copilot deve se comportar

- Ao iniciar qualquer tarefa de código, o Copilot deve mentalmente (ou explicitamente, se o usuário pedir) posicionar a tarefa dentro deste fluxo e indicar em que etapa está.
- Nunca sugerir "implementar direto" sem passar por: branch → implementação → testes → documentação → safe-crawl.
- Se o usuário pedir para pular uma etapa (ex: "não precisa de teste agora"), o Copilot pode obedecer, mas deve alertar explicitamente que a etapa está sendo pulada e quais os riscos.
- Ao final de uma tarefa, o Copilot deve apresentar um checklist do que foi feito e o que ainda falta no fluxo, por exemplo:
  - [x] Branch criada: `feat/seo-analyzer`
  - [x] Implementação concluída
  - [ ] Testes pendentes
  - [ ] Documentação pendente
  - [ ] Safe-crawl pendente
  - [ ] Merge pendente
- Sempre referenciar `branching.md` ao criar ou nomear branches, para manter consistência entre os dois arquivos de regras.