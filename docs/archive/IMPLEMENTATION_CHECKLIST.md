# Med Fit — Checklist de Implementação Sprint 3

## 🔍 Verificações Críticas

### 1. Dados de Seed ✅
- [x] Usuários Carlos e Rafael criados
- [x] Profiles completos
- [x] Health records com dados realistas
- [x] Medications com horários
- [x] AI assessments com mock data
- [x] Meal plans para ambos
- [x] Workout plans para ambos
- [x] Goals definidos
- [ ] Verificar: há body_measurements, diet_logs, training_routines

### 2. Completude da IA ✅
- [x] Graph LangGraph montado
- [x] 5 agentes definidos
- [x] Mock determinístico implementado
- [x] Prompts em Portuguese
- [x] JSON structure correto
- [x] Persistência no BD
- [ ] Verificar: se assessments estão sendo salvos com daily_mobile_plan

### 3. Mobile Experience
- [x] PWA manifest criado
- [x] Icons gerados
- [x] Navegação inferior implementada
- [x] Páginas mobile criadas
- [ ] Verificar: se notificações push estão configuradas
- [ ] Verificar: se Service Worker está registrado corretamente

### 4. Segurança
- [x] RLS policies em todas as tabelas
- [x] Service role key marcado como server-only
- [x] URLs assinadas temporárias
- [ ] Verificar: se validação Zod está em todos os formulários
- [ ] Verificar: se sanitização está implementada

---

## 📝 Tasks de Implementação

### Task 1: Melhorar dados de seed com body scans
**Status:** TODO
**Prioridade:** Alta

Adicionar dados de body_scan_sessions, body_scan_photos, body_scan_measurements aos pacientes de teste para ter histórico visual completo.

```sql
-- Adicionar 3 scans anteriores para Carlos (30, 60, 90 dias atrás)
-- Adicionar 2 scans anteriores para Rafael (30, 60 dias atrás)
```

**Arquivo:** `supabase/seed.sql`  
**Estimativa:** 30 min

---

### Task 2: Garantir daily_mobile_plan é gerado corretamente
**Status:** TODO
**Prioridade:** Alta

Verificar que o nó `GenerateDailyPlanNode` no grafo está gerando `daily_mobile_plan` completo e salvando na tabela `ai_assessments`.

**Passos:**
1. Verificar `src/lib/ai/graph.ts` — nó `GenerateDailyPlanNode`
2. Verificar se está salvando `daily_mobile_plan` na tabela
3. Testar chamando POST /api/ai/assessment

**Arquivo:** `src/lib/ai/graph.ts`  
**Estimativa:** 20 min

---

### Task 3: Implementar notificações push estruturadas
**Status:** TODO
**Prioridade:** Média

Criar estrutura para notificações push baseado em:
- Lembretes de medicamentos (baseado em medication_schedules)
- Lembretes de refeições (baseado em meal_plans)
- Lembretes de água (2x dia)
- Lembretes de treino (baseado em workout_plans)
- Alerta de check-in mensal (a cada 30 dias)

**Arquivos:**
- `src/lib/notifications.ts` — lógica de scheduling
- `src/components/mobile/RegisterSW.tsx` — service worker registration
- `supabase/functions/notify` (nova) — edge function para enviar notificações

**Estimativa:** 2-3 horas

---

### Task 4: Validação com Zod em formulários críticos
**Status:** TODO
**Prioridade:** Média

Verificar e implementar validação Zod em:
- LoginForm
- RegisterForm
- PatientForm (onboarding)
- MedicationForm
- BodyPhotoUpload
- ExamUpload
- ConsentForm

**Arquivo:** `src/lib/validators.ts`  
**Estimativa:** 1-2 horas

---

### Task 5: Melhorar Dashboard — adicionar contexto visual
**Status:** TODO
**Prioridade:** Baixa

Adicionar:
- [ ] Card de "próxima tarefa" (treino, refeição, medicamento)
- [ ] Mini-timeline de eventos recentes
- [ ] Quick stats (adesão última semana)
- [ ] Recomendação IA em destaque

**Arquivo:** `src/components/dashboard/DashboardCards.tsx`  
**Estimativa:** 1-2 horas

---

### Task 6: Testar fluxo E2E completo
**Status:** TODO
**Prioridade:** Alta

1. Novo usuário: cadastro
2. Onboarding: preencher todos os campos
3. Consentimento: aceitar
4. Análise: gerar (aguardar resultado)
5. Dashboard: verificar dados
6. Mobile: completar um treino
7. Mobile: registrar refeição
8. Mobile: fazer check-in

**Estimativa:** 1-2 horas (manual)

---

### Task 7: Garantir compatibilidade mobile
**Status:** TODO
**Prioridade:** Média

Verificar em devices reais:
- [ ] iPhone 12/13/14
- [ ] Android (Samsung Galaxy)
- [ ] Tablet (iPad)
- [ ] Responsividade em 375px, 768px, 1024px

**Ferramentas:**
- Chrome DevTools (device emulation)
- BrowserStack (opcional)

**Estimativa:** 1-2 horas

---

### Task 8: Performance & Lighthouse
**Status:** TODO
**Prioridade:** Baixa

Rodar Lighthouse em:
- Landing page
- Dashboard
- Hoje (mobile)
- Treino

Metas:
- Performance: ≥ 85
- Accessibility: ≥ 90
- Best Practices: ≥ 90

**Ferramenta:** Chrome DevTools → Lighthouse

**Estimativa:** 1-2 horas

---

## 🚀 Execução Recomendada

### Dia 1 (4-6 horas)
1. Task 1: Melhorar seed com body scans
2. Task 2: Garantir daily_mobile_plan
3. Task 6: Teste E2E básico

### Dia 2 (4-6 horas)
1. Task 4: Validação Zod
2. Task 3: Notificações push (até onde der)

### Dia 3 (2-4 horas)
1. Task 7: Compatibilidade mobile
2. Task 8: Performance (se tempo)

---

## 🔧 Como Executar Tasks

### Build & Deploy Local
```bash
npm run build && npm start
# ou
npm run dev
```

### Testes
```bash
# TypeScript
npx tsc --noEmit

# Build
npm run build

# Linter (future)
npm run lint
```

### Supabase Local (se setup novo)
```bash
supabase start
supabase seed run
```

---

## 📊 Métricas de Sucesso

- [x] Build passa sem erros (Next.js)
- [x] TypeScript sem erros
- [x] Schema BD completo com RLS
- [x] 23 páginas criadas
- [ ] Novo usuário consegue fazer fluxo E2E completo
- [ ] Dados de seed estão completos e realistas
- [ ] Notificações funcionando (estrutura + mock)
- [ ] Mobile responsivo em todos os tamanhos
- [ ] Lighthouse scores ≥ 85

---

**Última atualização:** 2026-06-12  
**Responsável:** Claude  
**Próxima revisão:** Após completar Task 1-2
