# 🏗️ Especificação de Arquitetura Técnica (ARCHITECTURE.md)

Este documento detalha a arquitetura do ecossistema do **Med Fit**, mapeando as tecnologias utilizadas, a modelagem de banco de dados e a integração de inteligência artificial.

---

## 💻 1. Stack de Tecnologias

```
Next.js 15 (App Router) + TypeScript + Tailwind CSS
                     ↓
Supabase (Auth, Postgres RLS, Storage, Edge Functions, pgvector)
                     ↓
LangGraph (Orquestração Multiagente) + Claude API (Opus/Haiku)
                     ↓
MediaPipe (Pose Landmarker local) + Tesseract.js (OCR local)
```

---

## 📂 2. Estrutura de Diretórios do Projeto

*   `supabase/`: Código e scripts do Backend.
    *   `migrations/`: Esquemas de tabelas SQL, políticas de RLS e triggers.
    *   `seed.sql`: Script de população inicial com dados clínicos realistas para Carlos e Rafael.
    *   `functions/`: Supabase Edge Functions (e.g. `embed` para geração de vetores).
*   `src/app/`: Roteamento e páginas da aplicação Next.js (App Router).
    *   `(auth)/`: Rotas públicas de autenticação, cadastro e recuperação de senha.
    *   `(app)/`: Rotas privadas do dashboard, visualização mobile, diário do paciente e evolução.
*   `src/components/`: Componentes React modulares.
    *   `dashboard/`: Cards de resumos, timelines e gráficos.
    *   `mobile/`: Componentes da visualização otimizada para smartphones (PWA).
    *   `onboarding/`: Formulários de cadastro de histórico de saúde e objetivos.
*   `src/lib/`: Módulos de lógica principal do sistema.
    *   `ai/`: Arquivos do grafo do LangGraph (`graph.ts`), prompts (`prompts.ts`), clientes de LLM (`llm.ts`) e o mock estruturado (`mock.ts`).
    *   `vision/`: Algoritmos de visão computacional integrando o MediaPipe Landmarker.
    *   `rag/`: Lógica de busca semântica no banco vetorial pgvector.
    *   `supabase/`: Instanciação e clientes do Supabase (Client e Admin/Server-only).

---

## 🗄️ 3. Modelagem do Banco de Dados & Storage

O banco de dados utiliza o **PostgreSQL** hospedado no Supabase. O schema completo de 25+ tabelas está estruturado em `supabase/migrations/0001_schema.sql` e abrange:
*   `profiles`: Dados básicos dos usuários (relacionado ao `auth.users` do Supabase).
*   `health_records`: Condições clínicas, lesões, dores e alergias.
*   `medications` & `medication_schedules`: Medicamentos declarados pelo paciente e seus horários.
*   `diet_plans` & `workout_plans`: Prescrições/recomendações geradas pelos agentes de IA.
*   `body_scan_sessions`, `body_scan_photos` & `body_scan_measurements`: Dados e perímetros da visão computacional.
*   `ai_assessments`: Guarda o histórico de avaliações geradas pelo LangGraph (incluindo o `daily_mobile_plan` e a discussão interna dos agentes).

### RAG e pgvector
*   Os documentos e resumos das análises dos pacientes são fragmentados e armazenados na tabela `patient_documents`.
*   A tabela `patient_embeddings` armazena os vetores correspondentes (384 dimensões), possibilitando a busca por similaridade semântica (RAG) no nó `RetrievePatientMemory` do grafo.

### Supabase Storage
Os arquivos sensíveis são guardados em buckets de acesso estritamente **privado**:
*   `exams`: Laudos de exames enviados pelo paciente.
*   `body-photos`: Fotos enviadas para o Body Vision.
*   `avatars`: Imagens de perfil.
As URLs expostas ao frontend são geradas dinamicamente e assinadas temporariamente com validade máxima de **10 minutos**, aumentando a segurança.

---

## 🤖 4. Orquestração Multiagente (LangGraph)

O fluxo da IA está implementado em [graph.ts](file:///Users/daniel/MedFit/src/lib/ai/graph.ts). Ele orquestra os nós de processamento e os agentes inteligentes usando o LangGraph. 

1.  **CollectPatientDataNode:** Consolida as informações de perfil, exames, histórico e objetivos.
2.  **RetrievePatientMemoryNode (RAG):** Executa uma busca vetorial no Supabase para buscar o histórico de avaliações passadas do paciente.
3.  **ExamAnalysisNode (OCR):** Processa o texto bruto extraído localmente por OCR no laudo médico do paciente.
4.  **BodyVisionAnalysisNode:** Envia as medidas antropométricas do MediaPipe para análise do Body Vision Agent.
5.  **Multi-Agent Nodes (Sports MD, Nutritionist, Trainer):** Processam de forma sequencial, onde cada especialista gera sua parte da avaliação considerando o parecer do anterior.
6.  **AgentDiscussionNode:** Simula uma conversa entre os agentes na mesa de discussão multidisciplinar.
7.  **SafetyValidationNode:** Analisa se o plano consolidado viola regras de segurança clínica. Se for inseguro, devolve para a discussão com apontamentos.
8.  **IntegratedPlanNode:** Consolida a versão final do plano de 30 dias.
9.  **GenerateDailyPlanNode:** Cria a agenda de atividades diárias (refeições, treinos, medicamentos) apresentada na home do mobile.
10. **SaveAssessmentNode:** Persiste o resultado no Supabase.
