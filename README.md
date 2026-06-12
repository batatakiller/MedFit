# Med Fit 🩺💪

Plataforma SaaS de acompanhamento de saúde, composição corporal, dieta, treino, evolução física e
rotina diária do paciente, com **equipe multidisciplinar virtual de IA** (médico do esporte,
nutricionista, treinador físico, especialista em análise corporal por imagem e supervisor),
orquestrada com **LangGraph**.

> ⚠️ **O Med Fit é apoio educacional, estratégico e preventivo.** Não substitui atendimento médico,
> diagnóstico, prescrição, nutricionista ou treinador presenciais. A área de medicamentos apenas
> **registra e lembra** medicamentos já utilizados pelo paciente — a IA nunca prescreve, altera ou
> suspende medicamentos.

## Stack

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS** — interface responsiva mobile-first, PWA instalável
- **Supabase** — Auth, Postgres (RLS em todas as tabelas), Storage (buckets privados + URLs assinadas), Edge Functions, Vector/pgvector (RAG do paciente)
- **LangGraph + Anthropic Claude** — orquestração multiagente (com **mock integrado** quando a API não está configurada)
- **MediaPipe Pose Landmarker** — pipeline híbrido de análise corporal por fotos (detecção no dispositivo)
- **tesseract.js** — OCR básico de exames (no dispositivo)
- **Recharts** — gráficos de evolução

## Rodando localmente

```bash
# 1. Dependências
npm install

# 2. Supabase local (CLI: https://supabase.com/docs/guides/cli)
supabase start            # aplica migrations de supabase/migrations + seed.sql
# pacientes demo: carlos@medfit.demo / rafael@medfit.demo (senha: medfit123)

# 3. Ambiente
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (saída do supabase start)
# (opcional) ANTHROPIC_API_KEY para a IA real — sem ela, roda o mock multiagente
# (opcional) MEDFIT_EMBED_FUNCTION_URL após `supabase functions deploy embed`

# 4. Ícones do PWA + dev server
npm run icons
npm run dev
```

### Testes de segurança (RLS)

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f tests/rls.test.sql
```

Verifica que um paciente não lê/edita dados de outro (SELECT/INSERT/UPDATE cruzados bloqueados).

## Arquitetura da IA multiagente (LangGraph)

```
START → CollectPatientData → RetrievePatientMemory(RAG) → ExamAnalysis(OCR)
      → BodyVisionAnalysis → MedicalSportAgent → NutritionAgent → TrainingAgent
      → AgentDiscussion → SafetyValidation ⟲(revisão se inseguro)
      → IntegratedPlan → GenerateDailyPlan → SaveAssessment → END
```

- O **médico do esporte tem prioridade** em casos de risco; nutrição/treino recebem o parecer dele.
- `SafetyValidationNode` pode devolver o fluxo para a discussão (1 revisão) antes do plano final.
- `SaveAssessmentNode` grava avaliação, conversa dos agentes, decisões, planos ativos e vetoriza
  os artefatos em `patient_documents`/`patient_embeddings` (pgvector, 384 dims via Edge Function `embed`).
- Sem `ANTHROPIC_API_KEY`, cada nó usa o **mock determinístico** (`src/lib/ai/mock.ts`) — o grafo e a
  persistência são exatamente os mesmos.

## Pipeline híbrido de análise corporal

1. Upload e validação de qualidade das fotos (frente/costas/perfis)
2. Detecção de pose — MediaPipe Pose Landmarker (BlazePose GHUM, **no dispositivo**)
3. Escala pela altura informada → estimativas de circunferências (modelo elíptico) e % de gordura
   (US Navy/Deurenberg) com **margem de erro e confiança declaradas**
4. Comparação mensal + interpretação pelo Body Vision Agent
5. Estrutura pronta para versão avançada 3D (SMPL/SMPL-X/DensePose) em `src/lib/vision/smpl.ts`

## Segurança e LGPD

- RLS `user_id = auth.uid()` (SELECT/INSERT/UPDATE/DELETE) em todas as tabelas
- Buckets privados (`exams`, `body-photos`, `avatars`) com pasta por usuário e URLs assinadas (10min)
- Service role key **somente** no servidor (`src/lib/supabase/admin.ts` é `server-only`)
- Consentimentos específicos versionados (dados sensíveis, exames, fotos, lembretes de medicamentos)
- Exportação de dados, exclusão de exames/fotos e solicitação de exclusão de conta em Configurações
- Logs sem dados clínicos

## Estrutura

```
supabase/           migrations (schema, RLS, pgvector, storage), seed, edge functions
src/middleware.ts   proteção de rotas + sessão
src/lib/ai/         graph (LangGraph), prompts, llm (Claude), mock, types
src/lib/vision/     pipeline híbrido + mediapipe + contrato SMPL 3D
src/lib/rag/        embeddings + busca semântica (match_patient_documents)
src/app/(auth)/     login, cadastro, recuperar senha, confirmação
src/app/(app)/      rotas privadas: dashboard, hoje, treino, dieta, medicações,
                    evolução, check-ins, fotos, scans, comparativo, plano, exames...
src/components/     ui, auth, onboarding, diet, training, meds, photos, charts, ai...
```
