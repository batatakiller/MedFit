-- ════════════════════════════════════════════════════════════════════════
-- Testes básicos de RLS — garante que um usuário NÃO acessa dados de outro.
-- Rodar no banco local (após migrations + seed):
--   psql "$DATABASE_URL" -f tests/rls.test.sql
-- Usa os pacientes do seed: Carlos (1111...) e Rafael (2222...).
-- ════════════════════════════════════════════════════════════════════════
begin;

create or replace function pg_temp.assert_eq(actual bigint, expected bigint, test text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FALHOU: % (esperado %, obtido %)', test, expected, actual;
  end if;
  raise notice 'OK: %', test;
end $$;

-- Simula requisição autenticada do Carlos
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select pg_temp.assert_eq(
  (select count(*) from public.profiles), 1,
  'Carlos vê apenas o próprio profile');

select pg_temp.assert_eq(
  (select count(*) from public.profiles where user_id = '22222222-2222-2222-2222-222222222222'), 0,
  'Carlos NÃO vê o profile do Rafael');

select pg_temp.assert_eq(
  (select count(*) from public.medications where user_id <> '11111111-1111-1111-1111-111111111111'), 0,
  'Carlos NÃO vê medicamentos de outros pacientes');

select pg_temp.assert_eq(
  (select count(*) from public.ai_assessments where user_id <> '11111111-1111-1111-1111-111111111111'), 0,
  'Carlos NÃO vê avaliações de outros pacientes');

-- INSERT cruzado deve falhar
do $$
begin
  insert into public.water_logs (user_id, amount_ml)
  values ('22222222-2222-2222-2222-222222222222', 200);
  raise exception 'FALHOU: Carlos conseguiu inserir water_log para Rafael';
exception
  when insufficient_privilege or check_violation then
    raise notice 'OK: INSERT cruzado bloqueado pela RLS';
end $$;

-- UPDATE cruzado não afeta linhas
do $$
declare n int;
begin
  update public.health_records set weight = 1
  where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  if n > 0 then
    raise exception 'FALHOU: Carlos alterou health_record do Rafael';
  end if;
  raise notice 'OK: UPDATE cruzado não afeta linhas (0 rows)';
end $$;

-- Troca para Rafael e confere o espelho
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select pg_temp.assert_eq(
  (select count(*) from public.medications), 0,
  'Rafael não vê os medicamentos do Carlos (ele não tem nenhum)');

select pg_temp.assert_eq(
  (select count(*) from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'), 0,
  'Rafael NÃO vê o profile do Carlos');

-- Anônimo não vê nada
set local role anon;
set local request.jwt.claims to '{}';
select pg_temp.assert_eq((select count(*) from public.profiles), 0, 'Anônimo não vê profiles');
select pg_temp.assert_eq((select count(*) from public.ai_assessments), 0, 'Anônimo não vê avaliações');

rollback;
