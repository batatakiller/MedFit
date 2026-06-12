-- ════════════════════════════════════════════════════════════════════════
-- Med Fit — Row Level Security
-- Regra única: cada usuário só lê/cria/edita/exclui as PRÓPRIAS linhas
-- (user_id = auth.uid()). Bloqueia qualquer acesso cruzado entre pacientes.
-- ════════════════════════════════════════════════════════════════════════

-- Gera as 4 policies padrão para uma tabela com coluna user_id.
do $$
declare
  t text;
  tables text[] := array[
    'profiles','health_records','body_measurements',
    'medications','medication_schedules','medication_logs',
    'exams','diet_logs','daily_meal_tasks','water_logs',
    'training_routines','workout_plans','daily_workout_tasks','exercise_logs',
    'goals','ai_assessments','meal_plans','monthly_checkins','daily_checkins',
    'notifications','push_subscriptions','subscriptions',
    'patient_documents',
    'body_scan_sessions','body_scan_photos','body_scan_measurements','body_scan_reports',
    'agent_conversations','agent_decisions','consents'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$
      create policy "%1$s_select_own" on public.%1$I
        for select to authenticated using (user_id = auth.uid())
    $p$, t);
    execute format($p$
      create policy "%1$s_insert_own" on public.%1$I
        for insert to authenticated with check (user_id = auth.uid())
    $p$, t);
    execute format($p$
      create policy "%1$s_update_own" on public.%1$I
        for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
    $p$, t);
    execute format($p$
      create policy "%1$s_delete_own" on public.%1$I
        for delete to authenticated using (user_id = auth.uid())
    $p$, t);
  end loop;
end $$;

-- Consentimentos são registro legal: usuário não edita nem apaga o aceite.
drop policy "consents_update_own" on public.consents;
drop policy "consents_delete_own" on public.consents;

-- Assinatura: plano/status são alterados apenas pelo backend (service role
-- ignora RLS); o usuário não atualiza a própria linha diretamente.
drop policy "subscriptions_update_own" on public.subscriptions;
drop policy "subscriptions_insert_own" on public.subscriptions;
drop policy "subscriptions_delete_own" on public.subscriptions;
