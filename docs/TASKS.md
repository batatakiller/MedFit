# 📝 Backlog de Tarefas e Planejamento (TASKS.md)

Este documento centraliza as tarefas planejadas para a evolução do Med Fit, divididas por prioridade e sprints.

---

## 🎯 1. Curto Prazo: Sprint 3 (Foco em Refinamento e MVP)

Estas são as tarefas prioritárias atualmente identificadas no projeto:

### 🔴 Alta Prioridade
*   **Task 1: Enriquecer dados de seed com Body Scans**
    *   **Descrição:** Adicionar dados históricos de `body_scan_sessions`, `body_scan_photos` e `body_scan_measurements` em `supabase/seed.sql`.
    *   **Objetivo:** Permitir que os usuários de teste (Carlos e Rafael) já entrem no app exibindo gráficos de evolução corporal realistas e imagens comparativas anteriores de 30/60 dias.
*   **Task 2: Garantir persistência do daily_mobile_plan**
    *   **Descrição:** Validar se o nó `GenerateDailyPlanNode` no grafo de IA (`src/lib/ai/graph.ts`) está gravando a estrutura correta de agenda diária na tabela `ai_assessments`.
    *   **Objetivo:** Garantir que o app mobile do paciente renderize corretamente o treino do dia e as refeições após a IA rodar.

### 🟡 Média Prioridade
*   **Task 3: Notificações Push Estruturadas**
    *   **Descrição:** Criar a estrutura básica e os agendamentos (scheduling) para disparar notificações móveis.
    *   **Detalhes:** Lembretes de remédios baseados nos horários de ingestão, notificações de refeições, alertas diários de ingestão de água (2x ao dia) e avisos de check-in mensal.
*   **Task 4: Validação de Formulários com Zod**
    *   **Descrição:** Verificar a cobertura de validação do Zod em todos os formulários críticos da aplicação: `LoginForm`, `RegisterForm`, `PatientForm` (Onboarding), `MedicationForm`, `BodyPhotoUpload`, `ExamUpload` e `ConsentForm`.

### 🟢 Baixa Prioridade
*   **Task 5: Contexto Visual no Dashboard**
    *   **Descrição:** Inserir melhorias no dashboard web, como card indicando a "próxima tarefa pendente" do paciente (e.g., "Próxima refeição: Almoço em 20 min" ou "Próximo medicamento às 14h") e uma mini-timeline de eventos recentes.

---

## 🚀 2. Médio Prazo (1 a 2 semanas)

*   **Integração de Gateway de Pagamentos:** Implementação de checkout (Stripe ou Mercado Pago) para plano de assinatura do SaaS.
*   **Auditorias de Performance & Acessibilidade:** Rodar Lighthouse audits nas telas principais e otimizar imagens/código para atingir notas acima de 85 em performance e 90 em acessibilidade.
*   **Testes em Dispositivos Físicos:** Testar a experiência PWA (instalação e carregamento offline com Service Worker) em celulares reais iOS e Android.

---

## 🏔️ 3. Longo Prazo (Roadmap Futuro)

*   **SMPL 3D Body Mesh:** Integração com modelos 3D avançados baseados em pose para visualização tridimensional realística da composição corporal do paciente.
*   **Sincronização com Google Calendar / Apple Health:** Permitir que o cronograma de refeições e treinos seja sincronizado automaticamente com os calendários e trackers de saúde nativos dos celulares.
*   **Suíte de Testes E2E com Playwright:** Automatizar testes de ponta a ponta simulando cadastro de paciente, preenchimento de anamnese e geração do plano de IA.
