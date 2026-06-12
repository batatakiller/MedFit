-- ════════════════════════════════════════════════════════════════════════
-- Med Fit — SEED (APENAS ambiente local / demonstração)
-- Cria 2 pacientes fictícios com login:
--   carlos@medfit.demo / medfit123  (42a, sobrepeso, pressão+diabetes)
--   rafael@medfit.demo / medfit123  (28a, magro, recomposição corporal)
-- ════════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── Usuários auth (padrão de seed local do Supabase) ─────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'carlos@medfit.demo', crypt('medfit123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Andrade"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'rafael@medfit.demo', crypt('medfit123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Rafael Lima"}', now(), now());

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"carlos@medfit.demo"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"rafael@medfit.demo"}', 'email', now(), now(), now());

-- O trigger handle_new_user já criou profiles + subscriptions. Completa os perfis:
update public.profiles set
  birth_date = '1984-03-12', age = 42, sex = 'masculino', height = 175, onboarding_completed = true
where user_id = '11111111-1111-1111-1111-111111111111';

update public.profiles set
  birth_date = '1998-07-25', age = 28, sex = 'masculino', height = 180, onboarding_completed = true
where user_id = '22222222-2222-2222-2222-222222222222';

-- ════════════════ PACIENTE 1 — Carlos (cauteloso e progressivo) ═════════
insert into public.health_records (user_id, weight, target_weight, body_fat_percentage, activity_level,
  stress_level, sleep_hours, main_goal, medical_conditions, injuries, allergies, dietary_restrictions)
values ('11111111-1111-1111-1111-111111111111', 98, 82, 31, 'sedentario', 'alto', 6,
  'fisico_atletico', array['pressao_alta','diabetes_tipo_2'], 'Dor lombar ocasional', 'Nenhuma', 'Nenhuma');

insert into public.body_measurements (user_id, weight, waist, hip, chest, abdomen, arm, thigh, neck, shoulder, measurement_date)
values
  ('11111111-1111-1111-1111-111111111111', 99.5, 110, 112, 112, 113, 36, 62, 43, 122, current_date - 30),
  ('11111111-1111-1111-1111-111111111111', 98.0, 108, 111, 111, 111, 36, 62, 43, 122, current_date);

insert into public.goals (user_id, goal_type, desired_body_description, target_date, motivation)
values ('11111111-1111-1111-1111-111111111111', 'fisico_atletico',
  'Reduzir barriga, ganhar condicionamento e chegar a um físico atlético e saudável.',
  current_date + 365, 'Quero ter saúde para acompanhar meus filhos e sair dos remédios no futuro, com orientação médica.');

insert into public.medications (user_id, name, dosage, frequency, reason) values
  ('11111111-1111-1111-1111-111111111111', 'Losartana', '50mg', '2x ao dia', 'Pressão alta'),
  ('11111111-1111-1111-1111-111111111111', 'Metformina', '850mg', '2x ao dia', 'Diabetes tipo 2');

insert into public.medication_schedules (user_id, medication_id, scheduled_time)
select m.user_id, m.id, t.h::time
from public.medications m
cross join (values ('08:00'), ('20:00')) as t(h)
where m.user_id = '11111111-1111-1111-1111-111111111111';

insert into public.diet_logs (user_id, breakfast, lunch, dinner, snacks, drinks, sweets, alcohol, ultra_processed_food, water_intake)
values ('11111111-1111-1111-1111-111111111111',
  'Pão francês com manteiga, café com açúcar', 'Arroz, feijão, carne frita, refrigerante',
  'Pizza ou lanche delivery', 'Salgadinhos e biscoito recheado', 'Refrigerante diariamente',
  'Sobremesa quase todo dia', 'Cerveja no fim de semana', 'Quase todos os dias', '~1L por dia');

insert into public.training_routines (user_id, current_training, frequency_per_week, experience_level, available_equipment, available_times, limitations)
values ('11111111-1111-1111-1111-111111111111', 'Nenhum treino atualmente', 0, 'sedentario',
  array['caminhada_ar_livre','halteres_leves'], 'Manhã cedo (6h-7h)', 'Dor lombar; evitar impacto alto');

-- Avaliação IA seed (mock) — plano cauteloso, foco em segurança
insert into public.ai_assessments (id, user_id, doctor_analysis, nutritionist_analysis, trainer_analysis, body_vision_analysis,
  integrated_plan, daily_mobile_plan, risk_alerts, next_steps, confidence_score, is_mock)
values (
  'aaaaaaaa-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"analysis":"Paciente 42 anos, IMC 32 (obesidade grau 1), sedentário, em uso de medicamentos para pressão alta e diabetes tipo 2 (cadastrados pelo próprio paciente). Risco cardiometabólico relevante: a progressão deve ser lenta e monitorada.","recommendations":["Validação médica presencial ANTES de iniciar treinos de intensidade moderada/alta","Monitorar pressão arterial e glicemia conforme orientação do seu médico","Interromper exercício e procurar atendimento se houver dor no peito, tontura ou falta de ar"],"warnings":["O Med Fit não substitui consulta médica, não prescreve nem altera medicamentos."]}',
  '{"analysis":"Dieta atual hipercalórica, rica em ultraprocessados e açúcar, com baixa hidratação. Para risco metabólico, começar com déficit calórico moderado (~500 kcal), fibras altas e proteína adequada.","strategy":"Déficit moderado e progressivo, reduzindo ultraprocessados e refrigerante; pratos com 50% vegetais; validar com nutricionista presencial pela presença de diabetes/hipertensão.","recommendations":["Trocar refrigerante por água/água com gás","Café da manhã com proteína e fruta","2L+ de água/dia"]}',
  '{"analysis":"Sedentário com dor lombar: iniciar com caminhada, mobilidade e musculação leve, progressão mensal de volume antes de intensidade.","progression":"Semanas 1-2 caminhada 20-30min + mobilidade; semanas 3-4 adiciona força leve 2x/sem; reavaliar em 30 dias.","recommendations":["Nunca treinar até exaustão nesta fase","Aquecer 8-10min sempre","Parar imediatamente se sentir dor no peito, tontura ou falta de ar"]}',
  '{"analysis":"Fotos indicam acúmulo de gordura predominantemente abdominal (padrão androide) e massa muscular aparente baixa. Estimativas visuais têm margem de erro e não substituem bioimpedância/DEXA.","confidence_level":"média","margin_of_error":"±4% gordura corporal; ±3cm medidas"}',
  '{"next_30_days":"Fase 1 — Segurança e hábito: caminhada progressiva, redução de ultraprocessados, hidratação 2L+, sono 7h+, monitoramento de sintomas. Sem treino intenso até liberação médica presencial.","monthly_goals":["-2 a -3kg","-2cm cintura","12 caminhadas no mês","Reduzir refrigerante a 1x/semana"],"habits":["Água ao acordar","Caminhar após o café","Prato com 50% vegetais","Dormir até 23h"],"metrics_to_track":["peso","cintura","pressão (com seu médico)","energia","sono"],"next_checkin":"30 dias"}',
  '{"today_summary":"Fase inicial: caminhada leve + hidratação + medicamentos cadastrados no horário.","water_goal_ml":2500}',
  array['Hipertensão + diabetes: obrigatório acompanhamento médico presencial','Não altere medicamentos por conta própria','Interrompa o treino se houver dor no peito, tontura ou falta de ar'],
  'Reavaliação em 30 dias com novas medidas, fotos e adesão.',
  0.78, true);

insert into public.meal_plans (user_id, assessment_id, title, calories_estimate, protein, carbs, fats, water_goal_ml, breakfast, lunch, dinner, snacks, notes)
values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111',
  'Plano alimentar — Fase 1 (déficit moderado e seguro)', 2100, 150, 210, 65, 2500,
  '["Omelete de 2 ovos com tomate","1 fatia de pão integral","Café sem açúcar","1 fruta"]',
  '["Arroz integral (4 col.)","Feijão (1 concha)","Frango grelhado (150g)","Salada à vontade com azeite"]',
  '["Sopa de legumes com frango desfiado","ou prato pequeno do almoço"]',
  '["Iogurte natural com fruta","Castanhas (1 punhado)"]',
  'Orientação educacional. Com diabetes/hipertensão, valide com nutricionista e médico presenciais.');

insert into public.workout_plans (user_id, title, weekly_frequency, progression_strategy, workout_days, notes)
values ('11111111-1111-1111-1111-111111111111', 'Treino Fase 1 — Base segura', 3,
  'Mês 1: volume baixo e técnica. Aumento de 10%/semana no tempo de caminhada. Força leve a partir da semana 3.',
  '[{"day":"seg","name":"Caminhada + Mobilidade","goal":"Condicionamento de base","duration":"35min","warmup":"5min caminhada bem leve","exercises":[{"name":"Caminhada ritmo confortável","sets":1,"reps":"25min","rest":0},{"name":"Mobilidade de quadril","sets":2,"reps":"10","rest":30},{"name":"Alongamento lombar (gato-vaca)","sets":2,"reps":"10","rest":30}]},{"day":"qua","name":"Força leve A","goal":"Adaptação neuromuscular","duration":"30min","warmup":"8min caminhada + mobilidade","exercises":[{"name":"Agachamento no banco","sets":2,"reps":"10-12","rest":90},{"name":"Remada elástico","sets":2,"reps":"12","rest":90},{"name":"Elevação de panturrilha","sets":2,"reps":"15","rest":60},{"name":"Prancha no joelho","sets":2,"reps":"20s","rest":60}]},{"day":"sex","name":"Caminhada + Core leve","goal":"Gasto calórico","duration":"35min","warmup":"5min leve","exercises":[{"name":"Caminhada","sets":1,"reps":"25min","rest":0},{"name":"Abdominal curto","sets":2,"reps":"10","rest":60},{"name":"Alongamento geral","sets":1,"reps":"5min","rest":0}]}]',
  'Pare imediatamente em caso de dor no peito, tontura, falta de ar intensa ou mal-estar e procure atendimento.');

-- ════════════════ PACIENTE 2 — Rafael (recomposição corporal) ═══════════
insert into public.health_records (user_id, weight, target_weight, body_fat_percentage, activity_level,
  stress_level, sleep_hours, main_goal, medical_conditions, injuries, allergies, dietary_restrictions)
values ('22222222-2222-2222-2222-222222222222', 70, 76, 18, 'leve', 'medio', 7,
  'recomposicao', array[]::text[], 'Nenhuma', 'Nenhuma', 'Nenhuma');

insert into public.body_measurements (user_id, weight, waist, hip, chest, abdomen, arm, thigh, neck, shoulder, measurement_date)
values
  ('22222222-2222-2222-2222-222222222222', 69.5, 82, 94, 95, 84, 30, 52, 37, 110, current_date - 30),
  ('22222222-2222-2222-2222-222222222222', 70.0, 81, 94, 96, 83, 30.5, 52.5, 37, 111, current_date);

insert into public.goals (user_id, goal_type, desired_body_description, target_date, motivation)
values ('22222222-2222-2222-2222-222222222222', 'recomposicao',
  'Ganhar massa muscular nos braços, peito e costas e definir o abdômen.',
  current_date + 240, 'Me sentir mais forte e confiante.');

insert into public.diet_logs (user_id, breakfast, lunch, dinner, snacks, drinks, sweets, alcohol, ultra_processed_food, water_intake, food_preferences)
values ('22222222-2222-2222-2222-222222222222',
  'Café com leite e biscoito', 'Marmita: arroz, feijão e frango', 'Sanduíche ou macarrão',
  'Quase não lancha', 'Suco e café', 'Raramente', 'Socialmente', '2-3x por semana', '~1,5L por dia',
  'Gosta de frango, ovos e banana');

insert into public.training_routines (user_id, current_training, frequency_per_week, experience_level, available_equipment, available_times, limitations)
values ('22222222-2222-2222-2222-222222222222', 'Musculação irregular, 1-2x por semana', 2, 'iniciante',
  array['academia_completa'], 'Noite (19h-21h)', 'Nenhuma');

insert into public.ai_assessments (id, user_id, doctor_analysis, nutritionist_analysis, trainer_analysis, body_vision_analysis,
  integrated_plan, daily_mobile_plan, risk_alerts, next_steps, confidence_score, is_mock)
values (
  'aaaaaaaa-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"analysis":"Paciente 28 anos, IMC 21,6, sem condições clínicas relatadas, sem medicamentos. Baixo risco para treino progressivo de força.","recommendations":["Check-up periódico é recomendado","Atenção a dores articulares ao progredir cargas"],"warnings":["Orientação educacional — não substitui avaliação médica presencial."]}',
  '{"analysis":"Ingestão calórica e proteica abaixo do necessário para hipertrofia. Recomposição: leve superávit (~250 kcal) com proteína ~1,8g/kg.","strategy":"Aumentar proteína (ovos, frango, iogurte), adicionar lanche pós-treino, manter gordura abdominal controlada com qualidade alimentar.","recommendations":["4 refeições/dia com fonte proteica","Banana + iogurte pós-treino","2,5L de água/dia"]}',
  '{"analysis":"Iniciante com academia completa: treino de força ABC 4x/semana com progressão dupla (reps→carga).","progression":"Mês 1 técnica e volume moderado; mês 2 +1 série nos básicos; mês 3 aumenta carga 2,5-5%.","recommendations":["Priorizar compostos: agachamento, supino, remada, terra romeno","Dormir 7h30+ para recuperação","Registrar cargas no app"]}',
  '{"analysis":"Fotos indicam biotipo magro com leve acúmulo de gordura abdominal inferior (skinny fat leve). Potencial visual de ganho rápido em ombros e costas.","confidence_level":"média-alta","margin_of_error":"±3% gordura corporal; ±2cm medidas"}',
  '{"next_30_days":"Recomposição: treino de força 4x/semana + superávit leve com proteína alta. Fotos e medidas a cada 30 dias.","monthly_goals":["+0,5 a +1kg massa","Manter cintura ≤82cm","16 treinos no mês","Proteína diária ≥120g"],"habits":["Lanche proteico pós-treino","Dormir 23h","Água 2,5L","Preparar marmitas no domingo"],"metrics_to_track":["peso","cintura","braço","carga nos básicos","fotos mensais"],"next_checkin":"30 dias"}',
  '{"today_summary":"Treino de força + proteína em todas as refeições.","water_goal_ml":2500}',
  array['Procure orientação presencial se sentir dor articular persistente'],
  'Reavaliação em 30 dias: medidas, fotos e progressão de cargas.',
  0.84, true);

insert into public.meal_plans (user_id, assessment_id, title, calories_estimate, protein, carbs, fats, water_goal_ml, breakfast, lunch, dinner, snacks, notes)
values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222',
  'Plano alimentar — Recomposição (superávit leve)', 2750, 130, 330, 85, 2500,
  '["3 ovos mexidos","2 fatias pão integral","1 banana","Café"]',
  '["Arroz (6 col.)","Feijão (1 concha)","Frango (180g)","Legumes"]',
  '["Macarrão com carne moída (prato médio)","Salada"]',
  '["Pós-treino: iogurte + banana + aveia","Mix de castanhas"]',
  'Orientação educacional — para ajustes finos, procure nutricionista presencial.');

insert into public.workout_plans (user_id, title, weekly_frequency, progression_strategy, workout_days, notes)
values ('22222222-2222-2222-2222-222222222222', 'Hipertrofia ABC — Iniciante', 4,
  'Progressão dupla: ao atingir o teto de reps em todas as séries, aumentar 2,5-5% a carga.',
  '[{"day":"seg","name":"A — Peito/Ombro/Tríceps","goal":"Hipertrofia","duration":"55min","warmup":"5min esteira + 2 séries leves supino","exercises":[{"name":"Supino reto","sets":3,"reps":"8-12","rest":90,"load":"a registrar"},{"name":"Supino inclinado halteres","sets":3,"reps":"10-12","rest":90},{"name":"Desenvolvimento halteres","sets":3,"reps":"10-12","rest":90},{"name":"Elevação lateral","sets":3,"reps":"12-15","rest":60},{"name":"Tríceps corda","sets":3,"reps":"10-12","rest":60}]},{"day":"ter","name":"B — Costas/Bíceps","goal":"Hipertrofia","duration":"55min","warmup":"5min remo + barra leve","exercises":[{"name":"Puxada frontal","sets":3,"reps":"8-12","rest":90},{"name":"Remada curvada","sets":3,"reps":"8-12","rest":90},{"name":"Remada baixa","sets":3,"reps":"10-12","rest":90},{"name":"Rosca direta","sets":3,"reps":"10-12","rest":60},{"name":"Rosca martelo","sets":3,"reps":"10-12","rest":60}]},{"day":"qui","name":"C — Pernas/Core","goal":"Hipertrofia","duration":"60min","warmup":"5min bike + agachamento livre","exercises":[{"name":"Agachamento livre","sets":3,"reps":"8-12","rest":120},{"name":"Leg press","sets":3,"reps":"10-12","rest":90},{"name":"Terra romeno","sets":3,"reps":"8-10","rest":120},{"name":"Panturrilha em pé","sets":4,"reps":"12-15","rest":60},{"name":"Prancha","sets":3,"reps":"40s","rest":60}]},{"day":"sex","name":"A2 — Peito/Ombro leve + abdômen","goal":"Volume extra","duration":"45min","warmup":"5min esteira","exercises":[{"name":"Supino máquina","sets":3,"reps":"10-12","rest":90},{"name":"Crucifixo","sets":3,"reps":"12","rest":60},{"name":"Abdominal infra","sets":3,"reps":"12-15","rest":60},{"name":"Abdominal oblíquo","sets":3,"reps":"12","rest":60}]}]',
  'Técnica acima de carga no primeiro mês.');

-- ════════════════ Body Scans (histórico para Carlos) ═════════════════════
insert into public.body_scan_sessions (user_id, scan_date, height_reference, weight_at_scan, confidence_score, body_fat_estimate, margin_of_error, notes)
values
  ('11111111-1111-1111-1111-111111111111', current_date - 90, 175, 102.0, 0.72, 33.5, '±4%', 'Scan inicial — 90 dias atrás'),
  ('11111111-1111-1111-1111-111111111111', current_date - 60, 175, 100.5, 0.74, 32.8, '±4%', 'Scan 60 dias atrás'),
  ('11111111-1111-1111-1111-111111111111', current_date - 30, 175, 99.0, 0.76, 32.0, '±4%', 'Scan 30 dias atrás'),
  ('11111111-1111-1111-1111-111111111111', current_date, 175, 98.0, 0.78, 31.2, '±3%', 'Scan atual — hoje');

-- Photos para cada scan (4 ângulos: frente, costas, esquerda, direita)
insert into public.body_scan_photos (user_id, scan_session_id, angle, quality_score)
select '11111111-1111-1111-1111-111111111111'::uuid, id, a, 0.80
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111',
     unnest(array['frente','costas','esquerda','direita']) a;

-- Medidas estimadas para cada scan
insert into public.body_scan_measurements (user_id, scan_session_id, waist_estimate, hip_estimate, chest_estimate, abdomen_estimate, arm_estimate, thigh_estimate, neck_estimate, shoulder_width_estimate, margin_of_error)
select '11111111-1111-1111-1111-111111111111'::uuid, id,
  110, 112, 112, 113, 36, 62, 43, 122, '±3cm'
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111' and scan_date = current_date - 90
union all
select '11111111-1111-1111-1111-111111111111'::uuid, id,
  109, 111, 111, 111, 36, 61, 43, 122, '±3cm'
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111' and scan_date = current_date - 60
union all
select '11111111-1111-1111-1111-111111111111'::uuid, id,
  108, 111, 111, 110, 36, 61, 43, 122, '±3cm'
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111' and scan_date = current_date - 30
union all
select '11111111-1111-1111-1111-111111111111'::uuid, id,
  107, 110, 111, 109, 36, 60, 43, 122, '±3cm'
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111' and scan_date = current_date;

-- Relatórios de análise corporal
insert into public.body_scan_reports (user_id, scan_session_id, posture_analysis, body_composition_analysis, visual_progress_analysis, recommendations, raw_ai_json)
select '11111111-1111-1111-1111-111111111111'::uuid, id,
  '{"alineamento":"Ombros levemente projetados para frente, pelve anterior leve, postura melhorando"}',
  '{"padrão_gordura":"Acúmulo predominante abdominal (androide)","massa_muscular":"Baixa, especialmente em pernas e tórax"}',
  '{"comparacao":"Redução gradual de 4kg e de cintura em 3cm nos últimos 90 dias","tendencia":"Positiva — perda de gordura, manutenção de massa"}',
  '["Manter déficit calórico moderado","Focar em treino de força para preservar/ganhar massa","Continuar caminhada para gasto diário"]',
  '{}'
from public.body_scan_sessions where user_id = '11111111-1111-1111-1111-111111111111';

-- ════════════════ Body Scans (histórico para Rafael) ═════════════════════
insert into public.body_scan_sessions (user_id, scan_date, height_reference, weight_at_scan, confidence_score, body_fat_estimate, margin_of_error, notes)
values
  ('22222222-2222-2222-2222-222222222222', current_date - 60, 180, 69.5, 0.78, 18.2, '±3%', 'Scan 60 dias atrás'),
  ('22222222-2222-2222-2222-222222222222', current_date - 30, 180, 69.8, 0.80, 17.9, '±3%', 'Scan 30 dias atrás'),
  ('22222222-2222-2222-2222-222222222222', current_date, 180, 70.0, 0.82, 17.6, '±3%', 'Scan atual — hoje');

-- Photos para cada scan de Rafael
insert into public.body_scan_photos (user_id, scan_session_id, angle, quality_score)
select '22222222-2222-2222-2222-222222222222'::uuid, id, a, 0.85
from public.body_scan_sessions where user_id = '22222222-2222-2222-2222-222222222222',
     unnest(array['frente','costas','esquerda','direita']) a;

-- Medidas estimadas para cada scan de Rafael
insert into public.body_scan_measurements (user_id, scan_session_id, waist_estimate, hip_estimate, chest_estimate, abdomen_estimate, arm_estimate, thigh_estimate, neck_estimate, shoulder_width_estimate, margin_of_error)
select '22222222-2222-2222-2222-222222222222'::uuid, id,
  82, 94, 95, 84, 30, 52, 37, 110, '±2cm'
from public.body_scan_sessions where user_id = '22222222-2222-2222-2222-222222222222' and scan_date = current_date - 60
union all
select '22222222-2222-2222-2222-222222222222'::uuid, id,
  81, 94, 96, 83, 30.2, 52.3, 37, 110.5, '±2cm'
from public.body_scan_sessions where user_id = '22222222-2222-2222-2222-222222222222' and scan_date = current_date - 30
union all
select '22222222-2222-2222-2222-222222222222'::uuid, id,
  81, 94, 97, 83, 30.5, 52.5, 37, 111, '±2cm'
from public.body_scan_sessions where user_id = '22222222-2222-2222-2222-222222222222' and scan_date = current_date;

-- Relatórios de análise corporal para Rafael
insert into public.body_scan_reports (user_id, scan_session_id, posture_analysis, body_composition_analysis, visual_progress_analysis, recommendations, raw_ai_json)
select '22222222-2222-2222-2222-222222222222'::uuid, id,
  '{"alineamento":"Postura neutra, ombros alinhados, bom alinhamento espinal"}',
  '{"padrão_gordura":"Leve acúmulo na região abdominal inferior (skinny fat leve)","massa_muscular":"Moderada, potencial de ganho rápido em ombros e costas"}',
  '{"comparacao":"Ganho de 0,5kg, manutenção de cintura, aumento discreto de tórax (hipertrofia)","tendencia":"Positiva — recomposição corporal em andamento"}',
  '["Manter superávit leve com proteína alta","Progressão linear de carga nos básicos","Fotos mensais para monitoramento visual"]',
  '{}'
from public.body_scan_sessions where user_id = '22222222-2222-2222-2222-222222222222';

-- Consentimentos dos dois pacientes (demo)
insert into public.consents (user_id, consent_type, accepted, version)
select u, c, true, '1.0'
from unnest(array['11111111-1111-1111-1111-111111111111'::uuid,'22222222-2222-2222-2222-222222222222'::uuid]) u,
     unnest(array['termos_uso','privacidade','dados_sensiveis','exames','fotos_corporais','lembretes_medicamentos']) c;
