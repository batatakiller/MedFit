# 🎯 Diretrizes de Desenvolvimento e Regras de Agente (Antigravity)

Este arquivo define as regras de desenvolvimento, design, segurança e comportamento para o agente **Antigravity** neste projeto.

---

## 🤖 1. Identidade e Comportamento do Agente

*   **Agente:** Antigravity (IA Desenvolvida pelo Google DeepMind).
*   **Idioma:** Comunique-se sempre em **Português (Brasil)** com o usuário.
*   **Comunicação:** Respostas concisas e diretas. Apresente resumos de progresso claros ao final de cada turno.

---

## ⚡ 2. Superpowers: Método de Programação e Revisão

### A. Planejamento Mandatório (Planning Mode)
Sempre que uma alteração exigir alterações arquiteturais, novas integrações ou tarefas complexas:
1.  **Pare e planeje:** Crie ou atualize o plano de implementação em `.gemini/.../implementation_plan.md`.
2.  **Organize tarefas:** Crie/atualize o arquivo `.gemini/.../task.md` para rastrear as atividades.
3.  **Aprovação:** Aguarde a aprovação expressa do usuário antes de iniciar qualquer alteração no código-fonte.
4.  **Revisão (Walkthrough):** Após concluir, crie/atualize o arquivo `.gemini/.../walkthrough.md`.

### B. Qualidade de Código & TypeScript
*   **Strict Mode:** Sem erros de tipagem. Execute sempre `npx tsc --noEmit`.
*   **Tipos Explícitos:** Evite o tipo `any`. Use tipos bem estruturados e interfaces TypeScript claras.
*   **Preservação:** Não apague nem modifique docstrings ou comentários existentes no código que não estejam relacionados com a sua tarefa.

### C. Design Premium e Mobile-First
*   **Estética Visual:** O design deve encantar o usuário. Use paletas de cores elegantes (Tailwind customizado, HSL), gradientes sutis e micro-animações.
*   **Sem Placeholders:** Evite dados estáticos não condizentes ou imagens de marcação. Use mockups e assets realistas.
*   **Mobile-First:** Toda interface de usuário (especialmente as visualizações móveis PWA) deve ser otimizada para telas a partir de 375px.

### D. Segurança & LGPD (Supabase)
*   **Row Level Security (RLS):** Toda nova tabela deve possuir RLS ativado com políticas rígidas (e.g., `user_id = auth.uid()`).
*   **Chaves do Supabase:** A `service_role_key` deve ser mantida estritamente no servidor (`server-only`).
*   **Validação & Sanitização:** Todos os inputs de formulários devem passar por validações Zod e sanitização de HTML/textos (`safeText`).

---

## 📂 3. Estrutura de Documentação do Projeto (Codex)

Utilize os seguintes caminhos para buscar contexto do projeto:
*   [PROJECT_SPEC.md](file:///Users/daniel/MedFit/docs/PROJECT_SPEC.md): Especificações das funcionalidades do produto.
*   [ARCHITECTURE.md](file:///Users/daniel/MedFit/docs/ARCHITECTURE.md): Detalhes do ecossistema técnico e infraestrutura.
*   [SECURITY.md](file:///Users/daniel/MedFit/docs/SECURITY.md): Diretrizes de segurança, privacidade de dados e LGPD.
*   [TASKS.md](file:///Users/daniel/MedFit/docs/TASKS.md): Planejamento de tarefas de longo prazo.

---

## 🧪 4. Validação de Alterações
Antes de finalizar qualquer tarefa, o agente deve:
1.  Executar verificação de tipos (`npx tsc --noEmit`).
2.  Executar compilação de produção (`npm run build`).
3.  Garantir que as regras de segurança RLS não foram violadas.
