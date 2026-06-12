# Sprint 3 — Med Fit — Plano de Continuação

## Status Atual do Projeto

### ✅ Implementado (Sprint 1 + 2)

#### Infraestrutura & Stack
- ✅ Next.js 15 (App Router) + TypeScript + Tailwind CSS
- ✅ Supabase Auth (login, cadastro, recuperação de senha, confirmação de email)
- ✅ Supabase Database com RLS em todas as tabelas
- ✅ Supabase Storage (buckets privados para exames, fotos corporais, avatars)
- ✅ Supabase Vector/pgvector para RAG
- ✅ LangGraph para orquestração multiagente
- ✅ MediaPipe Pose Landmarker para análise corporal
- ✅ Tesseract.js para OCR de exames
- ✅ PWA configurado com manifest, ícone, tela splash
- ✅ Middleware de autenticação e proteção de rotas

#### Banco de Dados
- ✅ Schema completo (25+ tabelas)
- ✅ RLS policies: SELECT, INSERT, UPDATE, DELETE bloqueados para outros usuários
- ✅ Seed com 2 pacientes fictícios:
  - Carlos (42a, sobrepeso, pressão+diabetes) — plano cauteloso
  - Rafael (28a, recomposição corporal) — plano de força
- ✅ Dados de seed realistas com histórico, medicamentos, medidas, dieta, treino

#### Autenticação & Segurança
- ✅ Login com email/senha
- ✅ Cadastro com validação
- ✅ Recuperação de senha
- ✅ Confirmação de email
- ✅ Redefinição de senha (Sprint 2)
- ✅ Middleware de sessão (servidor + cliente)
- ✅ Logout + destruição de sessão
- ✅ Redirecionamento automático (login → dashboard, dashboard → login)
- ✅ Service role key apenas no servidor (admin.ts marcado como server-only)
- ✅ URLs assinadas temporárias para Storage (10min)

#### Consentimento & LGPD
- ✅ Tela de consentimento inicial
- ✅ Consentimento específico para dados sensíveis
- ✅ Consentimento para exames
- ✅ Consentimento para fotos corporais
- ✅ Consentimento para análise de IA
- ✅ Consentimento para medicamentos cadastrados
- ✅ Tabela consents com versionamento
- ✅ Exportação de dados do usuário
- ✅ Exclusão de exames e fotos
- ✅ Solicitação de exclusão de conta
- ✅ Política de privacidade e termos de uso

#### Páginas Implementadas (23 rotas privadas + 6 públicas)

**Rotas Públicas:**
- ✅ Landing page (hero, especialistas, planos)
- ✅ Login
- ✅ Cadastro
- ✅ Recuperação de senha
- ✅ Termos de uso
- ✅ Política de privacidade

**Rotas Privadas (app):**
- ✅ Onboarding (formulário em etapas)
- ✅ Dashboard web (gráficos, cards, timeline)
- ✅ Hoje/Home mobile
- ✅ Treino do dia
- ✅ Dieta do dia
- ✅ Medicações cadastradas
- ✅ Evolução (medidas, fotos, histórico)
- ✅ Check-in rápido
- ✅ Check-in mensal
- ✅ Comparativo visual
- ✅ Scans corporais (histórico de body vision)
- ✅ Upload de exames
- ✅ Upload de fotos corporais
- ✅ Guia de fotos corporais
- ✅ Plano integrado (saída dos agentes)
- ✅ Plano alimentar
- ✅ Plano de treino
- ✅ Perfil do paciente
- ✅ Configurações (dark mode, exportação, exclusão)
- ✅ Notificações
- ✅ Assinatura/plano

#### IA Multiagente (LangGraph)

**Grafo:**
```
START → CollectPatientData → RetrievePatientMemory(RAG)
      → ExamAnalysis(OCR) → BodyVisionAnalysis
      → MedicalSportAgent → NutritionAgent → TrainingAgent
      → AgentDiscussion → SafetyValidation (com revisão de 1 passada se inseguro)
      → IntegratedPlan → GenerateDailyPlan → SaveAssessment → END
```

- ✅ Prompts específicos para cada agente
- ✅ Mock determinístico quando sem ANTHROPIC_API_KEY
- ✅ Integração com Claude (Opus 4.8) quando com API key
- ✅ Conversas entre agentes e validação de segurança
- ✅ Persistência de avaliações e decisões no BD
- ✅ Vetorização de contexto para RAG

**Agentes:**
1. ✅ Médico do Esporte — avalia risco, condições clínicas, segurança
2. ✅ Nutricionista — analisa dieta, cria plano alimentar
3. ✅ Treinador Físico — monta treinos progressivos
4. ✅ Especialista em Visão Corporal — analisa fotos, estima composição
5. ✅ Supervisor — coordena, valida segurança, gera plano final

#### Análise Corporal por Imagem

- ✅ Upload de fotos (frente, costas, laterais)
- ✅ Validação de qualidade
- ✅ Segmentação de corpo
- ✅ Detecção de pose com MediaPipe
- ✅ Cálculo de escala pela altura
- ✅ Estimativa de circunferências
- ✅ Estimativa de % gordura (fórmulas US Navy/Deurenberg)
- ✅ Margem de erro e confiança declaradas
- ✅ Comparação mensal com fotos anteriores
- ✅ Histórico de scans corporais
- ✅ Estrutura pronta para versão 3D (SMPL em src/lib/vision/smpl.ts)

#### OCR de Exames
- ✅ Upload de PDF/imagem
- ✅ Extração de texto com Tesseract.js
- ✅ Armazenamento de texto extraído
- ✅ Análise dos achados pela IA

#### Componentes React (~40 componentes)
- ✅ UI base (buttons, cards, forms, etc.)
- ✅ Auth (LoginForm, RegisterForm, ResetPasswordForm)
- ✅ Consent (ConsentForm)
- ✅ Onboarding (PatientForm com steps)
- ✅ Dashboard (DashboardCards, AlertsCard, TimelineProgress)
- ✅ Charts (ProgressChart, BodyMeasurementChart, AdherenceChart)
- ✅ Dieta (MealChecklist, WaterTracker, MealPlanCard)
- ✅ Treino (DailyWorkoutCard, WorkoutPlanCard, ExerciseChecklist, RestTimer)
- ✅ Medicações (MedicationList, MedicationScheduleCard)
- ✅ Fotos (BodyPhotoUpload, BodyPhotoGuide, BodyScanResult, BodyScanHistory)
- ✅ Comparativo (VisualProgressComparison)
- ✅ Check-ins (QuickCheckinForm, MonthlyCheckinForm, UpdateMeasurementsForm)
- ✅ AI (AgentPanels — médico, nutricionista, treinador, body vision)
- ✅ Mobile (BottomMobileNavigation, MobileTodayDashboard)
- ✅ Service Worker registration (PWA)

#### Funcionalidades Gerais
- ✅ Cálculo automático de IMC
- ✅ Estimativa de TDEE
- ✅ Estimativa de macros (proteína, carbs, fats)
- ✅ Gráficos de evolução (recharts)
- ✅ Histórico visual com comparativo antes/depois
- ✅ Notificações de lembretes (medicamentos, agua, treino, refeições)
- ✅ Status de notificações (pendente, enviada, lida)
- ✅ Sistema de alertas clínicos
- ✅ Interface mobile-first responsiva
- ✅ Dark mode opcional

---

## ❓ Potenciais Gaps / Verificação Necessária

Baseado no prompt original, precisa-se verificar/implementar:

### 1. **Mobile Experience & PWA**
- [ ] Verificar se PWA está instalável no celular de verdade
- [ ] Testar navegação inferior no mobile (BottomMobileNavigation)
- [ ] Verificar notificações push (estrutura criada, mas integração real com service worker)
- [ ] Testar responsividade em devices reais (iPhone, Android)
- [ ] Verificar performance no 3G/4G

### 2. **Análise Corporal Avançada**
- [ ] Estrutura para SMPL 3D existe, mas não está integrada ao fluxo
- [ ] Verificar se estimativas de medidas (cintura, quadril, etc.) estão acuradas
- [ ] Testar pipeline de fotos em qualidades variadas (fraca iluminação, ângulo errado)
- [ ] Implementar rejeiçã de fotos com qualidade muito baixa antes do processamento

### 3. **Integração Real da IA**
- [ ] Mock está funcionando, mas precisa testar com ANTHROPIC_API_KEY real
- [ ] Verificar se o grafo (LangGraph) está convertendo JSON corretamente
- [ ] Testar persistência de conversas entre agentes
- [ ] Verificar se safety validation está funcionando (loop de revisão)

### 4. **RAG & Memória**
- [ ] Embeddings estão sendo salvos no pgvector?
- [ ] Função Edge `embed` está deployada e funcionando?
- [ ] RAG está recuperando histórico relevante?
- [ ] Testes de busca semântica com dados do paciente

### 5. **Notificações**
- [ ] Push notifications configuradas no backend?
- [ ] Lembretes de medicamentos estão sendo enviados?
- [ ] Lembretes de refeições, água, treino?
- [ ] Alertas de check-in mensal?

### 6. **Dados de Teste**
- [ ] Seed de Carlos e Rafael criou dados completos?
- [ ] Há histórico suficiente (medidas, check-ins, body scans)?
- [ ] Fotos corporais de teste foram uploadadas?
- [ ] Exames PDFs foram uploadados?

### 7. **UI/UX**
- [ ] Design visual está premium e profissional?
- [ ] Cores/gradientes conforme especificação?
- [ ] Componentes reutilizáveis estão consistentes?
- [ ] Ícones do Lucide estão sendo usados corretamente?
- [ ] Responsive design em desktop, tablet, mobile?

### 8. **Segurança Avançada**
- [ ] Validação de entrada (Zod) em todos os formulários?
- [ ] Sanitização de dados antes de salvar?
- [ ] Erros genéricos (sem info sensível) em logs?
- [ ] Bioimpedância, DEXA, adipometria são sugeridas quando apropriado?
- [ ] Alertas de "consulte seu médico" aparecem em casos de risco?

### 9. **Completude do Fluxo**
- [ ] Onboarding leva usuário novo até dashboard completo?
- [ ] Análise multiagente é gerada após onboarding?
- [ ] Mobile consegue completar um treino full (init → exercício → final)?
- [ ] Mobile consegue registrar refeições e água completas?
- [ ] Check-in mensal gera atualização de plano?

### 10. **Compatibilidade**
- [ ] Build produção rodando sem errors?
- [ ] TypeScript strict mode passando?
- [ ] Linter (eslint) sem warnings?
- [ ] No Supabase, há function `embed` para gerar embeddings?

---

## 📋 Sprint 3 — Plano de Ação (Próximos Passos)

### Fase 1 — Verificação & Testes (1-2 dias)

1. **Teste de ponta a ponta (E2E):**
   - [ ] Cadastrar novo usuário (Google preferido, mas email também)
   - [ ] Completar onboarding até o fim
   - [ ] Gerar primeira análise (com mock)
   - [ ] Verificar se dados aparecem no dashboard
   - [ ] Testar upload de fotos corporais
   - [ ] Testar upload de exames
   - [ ] Acompanhar treino de hoje no mobile
   - [ ] Registrar refeições
   - [ ] Fazer check-in rápido

2. **Verificação de seed:**
   - [ ] Login com carlos@medfit.demo / rafael@medfit.demo
   - [ ] Verificar se ambos têm dados completos
   - [ ] Gerar nova análise para cada um
   - [ ] Comparar com mock esperado

3. **Teste de segurança (RLS):**
   - [ ] `psql -f tests/rls.test.sql` deve passar
   - [ ] Verificar que Carlos não lê dados de Rafael
   - [ ] Verificar que URL assinada expira

### Fase 2 — Melhorias & Fixes (baseado nos testes)

#### Se IA não estiver funcionando:
1. Verificar `ANTHROPIC_API_KEY` no `.env.local`
2. Testar chamada direto com Claude SDK
3. Verificar estrutura de resposta JSON

#### Se PWA não instalar:
1. Verificar manifest.json
2. Executar `npm run icons` para gerar ícones
3. Verificar service worker registration
4. Testar em Chrome DevTools (Application → Manifest)

#### Se RAG não funcionar:
1. Verificar se Edge Function `embed` existe:
   ```bash
   supabase functions list
   ```
2. Se não existir, criar:
   ```bash
   supabase functions new embed
   ```
3. Implementar com modelo de embeddings (OpenAI ou Anthropic)
4. Testes com `curl` para a função

#### Se notificações não chegarem:
1. Verificar se Service Worker está registrado
2. Verificar permissões no navegador
3. Testar com `Notification.requestPermission()`
4. Verificar logs no `src/components/mobile/RegisterSW.tsx`

### Fase 3 — Enhancements (se tempo)

1. **Análise Corporal 3D:**
   - Implementar SMPL em `src/lib/vision/smpl.ts`
   - Integrar ao pipeline de fotos
   - Gerar relatório 3D

2. **Integração com Plataforma de Pagamento:**
   - Stripe ou Mercado Pago para planos
   - Webhooks para ativar/desativar funcionalidades

3. **Relatório PDF:**
   - Gerar PDF do plano integrado
   - Enviar por email

4. **Integração com Google Calendar:**
   - Adicionar treinos e refeições ao calendário do usuário

5. **Histórico de Medicamentos:**
   - Gráfico de aderência
   - Lembretes inteligentes baseados em horário da tomada

---

## 🚀 Como Continuar

### Ambiente Local

```bash
# 1. Instalar Supabase CLI (se não tiver)
brew install supabase/tap/supabase

# 2. Iniciar Supabase local
supabase start

# 3. Preencher .env.local com URLs e keys do supabase start

# 4. Gerar ícones PWA
npm run icons

# 5. Dev server
npm run dev

# 6. Abrir http://localhost:3000
```

### Testes

```bash
# Testes RLS (segurança)
psql "postgresql://..." -f tests/rls.test.sql

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### Deploy

```bash
# Build
npm run build

# Start em prod (local)
npm start

# Em produção:
# → Vercel (recomendado)
# → Netlify
# → Self-hosted (Docker)
```

---

## 📊 Checklist de Completude (por feature)

### Med Fit Core
- [x] Autenticação básica
- [x] Consentimento LGPD
- [x] Onboarding
- [x] Análise IA multiagente
- [x] Dashboard
- [x] Plano alimentar
- [x] Plano de treino
- [ ] Acompanhamento diário (em testes)
- [ ] Check-ins (em testes)
- [ ] Notificações (estrutura pronta)

### Mobile
- [x] Interface responsiva
- [x] PWA configurado
- [x] Navegação inferior
- [x] Telas mobile (hoje, treino, dieta, meds, evolução)
- [ ] Notificações push (estrutura, precisa testar)

### Segurança
- [x] RLS em todas as tabelas
- [x] URLs assinadas
- [x] Service role key server-only
- [x] Validação Zod
- [ ] Rate limiting (future)
- [ ] 2FA (future)

### IA
- [x] LangGraph montado
- [x] 5 agentes definidos
- [x] Mock determinístico
- [ ] Integração real com Claude (teste pendente)
- [ ] RAG com pgvector (teste pendente)

---

## 📞 Próximos Steps Recomendados

1. **Amanhã:** Teste E2E completo (novo usuário → análise → mobile)
2. **Depois:** Fix de issues encontrados
3. **Depois:** Testes de IA real (ANTHROPIC_API_KEY)
4. **Depois:** Melhorias de UI/UX baseado em feedback

---

**Última atualização:** 2026-06-12  
**Status:** Sprint 2 concluída, pronto para Sprint 3
