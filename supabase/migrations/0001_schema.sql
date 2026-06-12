-- ════════════════════════════════════════════════════════════════════════
-- Med Fit — Schema principal
-- Todas as tabelas têm user_id → auth.users e RLS (ver 0002_rls.sql).
-- ════════════════════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

-- ── Perfil ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  age int,
  sex text check (sex in ('masculino','feminino','outro')),
  height numeric(5,2), -- cm
  onboarding_completed boolean not null default false,
  dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Saúde ────────────────────────────────────────────────────────────────
create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(5,2),
  target_weight numeric(5,2),
  body_fat_percentage numeric(4,1),
  activity_level text check (activity_level in ('sedentario','leve','moderado','muito_ativo','atleta')),
  stress_level text check (stress_level in ('baixo','medio','alto')),
  sleep_hours numeric(3,1),
  main_goal text,
  medical_conditions text[] default '{}', -- ex.: pressao_alta, diabetes, colesterol_alto
  injuries text,
  surgeries text,
  recurring_pain text,
  allergies text,
  dietary_restrictions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(5,2),
  waist numeric(5,1),
  hip numeric(5,1),
  chest numeric(5,1),
  abdomen numeric(5,1),
  arm numeric(5,1),
  thigh numeric(5,1),
  neck numeric(5,1),
  shoulder numeric(5,1),
  body_fat_percentage numeric(4,1),
  photos_url text[],
  measurement_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── Medicamentos (apenas registro/lembrete — o sistema NÃO prescreve) ────
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text,        -- informado pelo paciente
  frequency text,     -- informado pelo paciente
  reason text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_time time not null,
  days_of_week int[] not null default '{0,1,2,3,4,5,6}', -- 0=domingo
  start_date date default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_time timestamptz,
  status text not null default 'pendente' check (status in ('pendente','tomado','pulado')),
  taken_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ── Exames (arquivos no bucket privado `exams`) ──────────────────────────
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text not null,  -- path no bucket (não URL pública)
  file_name text not null,
  file_type text,
  extracted_text text,     -- OCR
  notes text,
  uploaded_at timestamptz not null default now()
);

-- ── Dieta ────────────────────────────────────────────────────────────────
create table public.diet_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  breakfast text, lunch text, dinner text, snacks text, drinks text,
  sweets text, alcohol text, ultra_processed_food text,
  water_intake text,
  food_preferences text,
  disliked_foods text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.daily_meal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  meal_type text not null check (meal_type in ('cafe','almoco','jantar','lanche')),
  title text not null,
  description text,
  completed boolean not null default false,
  completed_at timestamptz,
  off_plan boolean not null default false, -- saiu da dieta
  hunger_level int check (hunger_level between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  amount_ml int not null check (amount_ml > 0),
  created_at timestamptz not null default now()
);

-- ── Treino ───────────────────────────────────────────────────────────────
create table public.training_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_training text,
  frequency_per_week int,
  experience_level text check (experience_level in ('sedentario','iniciante','intermediario','avancado','atleta')),
  available_equipment text[] default '{}',
  available_times text,
  limitations text,
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  weekly_frequency int,
  workout_days jsonb not null default '[]', -- [{day,name,goal,duration,warmup,exercises:[{name,sets,reps,rest,load}],mobility,stretch}]
  progression_strategy text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.daily_workout_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  title text not null,
  description text,
  completed boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  perceived_difficulty int check (perceived_difficulty between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_workout_task_id uuid references public.daily_workout_tasks(id) on delete cascade,
  exercise_name text not null,
  sets int, reps text, load text, rest_seconds int,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ── Objetivo ─────────────────────────────────────────────────────────────
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in (
    'emagrecimento','ganho_massa','definicao','performance','saude_metabolica',
    'reducao_gordura_abdominal','fisico_atletico','recomposicao'
  )),
  desired_body_description text,
  target_date date,
  motivation text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── IA / Avaliações ──────────────────────────────────────────────────────
create table public.ai_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_analysis jsonb,
  nutritionist_analysis jsonb,
  trainer_analysis jsonb,
  body_vision_analysis jsonb,
  integrated_plan jsonb,
  daily_mobile_plan jsonb,
  risk_alerts text[] default '{}',
  next_steps text,
  confidence_score numeric(3,2), -- 0..1
  raw_json jsonb,
  is_mock boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.ai_assessments(id) on delete set null,
  title text not null,
  calories_estimate int,
  protein int, carbs int, fats int,
  breakfast jsonb default '[]',
  lunch jsonb default '[]',
  dinner jsonb default '[]',
  snacks jsonb default '[]',
  water_goal_ml int,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Check-ins ────────────────────────────────────────────────────────────
create table public.monthly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(5,2),
  waist numeric(5,1),
  adherence_diet int check (adherence_diet between 0 and 100),
  adherence_training int check (adherence_training between 0 and 100),
  energy_level int check (energy_level between 1 and 5),
  sleep_quality int check (sleep_quality between 1 and 5),
  stress_level int check (stress_level between 1 and 5),
  difficulties text,
  symptoms text,
  notes text,
  checkin_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  diet_completed boolean,
  workout_completed boolean,
  medication_completed boolean,
  water_completed boolean,
  slept_well boolean,
  energy_level int check (energy_level between 1 and 5),
  sleep_quality int check (sleep_quality between 1 and 5),
  symptoms text,
  pain text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── Notificações ─────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('treino','refeicao','agua','medicamento','checkin_mensal','alerta','sistema')),
  title text not null,
  message text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  status text not null default 'pendente' check (status in ('pendente','enviada','lida','cancelada')),
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ── Assinatura ───────────────────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'gratuito' check (plan in ('gratuito','essencial','performance')),
  status text not null default 'ativa' check (status in ('ativa','cancelada','inadimplente','trial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── RAG / Vetorização (ver 0003_vector.sql para coluna vector + busca) ──
create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'avaliacao_ia','exame_ocr','medicamento','restricao_alimentar','dieta_atual','rotina_treino',
    'checkin_mensal','checkin_diario','relatorio_corporal','plano_alimentar','plano_treino',
    'alerta_medico','preferencia','dificuldade','evolucao_mensal','conversa_agentes','decisao_agentes','adesao_diaria'
  )),
  title text not null,
  content_text text not null,
  source_file_url text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ── Body scan (análise corporal por imagem) ─────────────────────────────
create table public.body_scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_date date not null default current_date,
  height_reference numeric(5,2), -- cm informado pelo paciente (escala)
  weight_at_scan numeric(5,2),
  confidence_score numeric(3,2),
  body_fat_estimate numeric(4,1),
  margin_of_error text,
  status text not null default 'processando' check (status in ('processando','concluido','rejeitado')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.body_scan_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_session_id uuid not null references public.body_scan_sessions(id) on delete cascade,
  angle text not null check (angle in ('frente','lado_esquerdo','lado_direito','costas')),
  file_url text not null, -- path no bucket `body-photos`
  quality_score numeric(3,2),
  landmarks jsonb, -- pontos MediaPipe (pose) normalizados
  created_at timestamptz not null default now()
);

create table public.body_scan_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_session_id uuid not null references public.body_scan_sessions(id) on delete cascade,
  waist_estimate numeric(5,1),
  hip_estimate numeric(5,1),
  chest_estimate numeric(5,1),
  abdomen_estimate numeric(5,1),
  arm_estimate numeric(5,1),
  thigh_estimate numeric(5,1),
  neck_estimate numeric(5,1),
  shoulder_width_estimate numeric(5,1),
  margin_of_error text,
  created_at timestamptz not null default now()
);

create table public.body_scan_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_session_id uuid not null references public.body_scan_sessions(id) on delete cascade,
  posture_analysis jsonb,
  body_composition_analysis jsonb,
  visual_progress_analysis jsonb,
  recommendations text[],
  raw_ai_json jsonb,
  created_at timestamptz not null default now()
);

-- ── Conversa e decisões dos agentes ──────────────────────────────────────
create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.ai_assessments(id) on delete cascade,
  agent_name text not null check (agent_name in ('supervisor','medico_esporte','nutricionista','treinador','body_vision')),
  message_role text not null default 'agent',
  message_content text not null,
  seq int not null default 0,
  created_at timestamptz not null default now()
);

create table public.agent_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.ai_assessments(id) on delete cascade,
  supervisor_summary text,
  doctor_decision text,
  nutritionist_decision text,
  trainer_decision text,
  body_vision_decision text,
  final_integrated_decision text,
  created_at timestamptz not null default now()
);

-- ── Consentimentos (LGPD) ────────────────────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in (
    'termos_uso','privacidade','dados_sensiveis','exames','fotos_corporais','lembretes_medicamentos'
  )),
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  version text not null default '1.0',
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, version)
);

-- ── Índices ──────────────────────────────────────────────────────────────
create index on public.body_measurements (user_id, measurement_date desc);
create index on public.medication_logs (user_id, created_at desc);
create index on public.medication_schedules (user_id) where active;
create index on public.daily_meal_tasks (user_id, date);
create index on public.daily_workout_tasks (user_id, date);
create index on public.water_logs (user_id, date);
create index on public.daily_checkins (user_id, date desc);
create index on public.monthly_checkins (user_id, checkin_date desc);
create index on public.ai_assessments (user_id, created_at desc);
create index on public.body_scan_sessions (user_id, scan_date desc);
create index on public.patient_documents (user_id, type);
create index on public.agent_conversations (assessment_id, seq);
create index on public.notifications (user_id, status, scheduled_for);

-- ── updated_at automático ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_health_updated before update on public.health_records
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── Perfil + assinatura gratuita criados automaticamente no signup ──────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.subscriptions (user_id, plan, status) values (new.id, 'gratuito', 'ativa');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
