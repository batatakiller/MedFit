import { z } from "zod";

// Validação e sanitização de entradas do usuário (server + client).

const safeText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s.replace(/<[^>]*>/g, "")); // remove tags HTML

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(200),
  password: z.string().min(1, "Informe sua senha.").max(200),
});

export const registerSchema = z.object({
  name: safeText(120).pipe(z.string().min(2, "Informe seu nome.")),
  email: z.string().trim().email("Informe um e-mail válido.").max(200),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200),
  accepted: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os Termos de uso e a Política de privacidade." }),
  }),
});

export const personalDataSchema = z.object({
  name: safeText(120).pipe(z.string().min(2, "Informe seu nome")),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  sex: z.enum(["masculino", "feminino", "outro"]),
  height: z.coerce.number().min(100, "Altura em cm").max(250),
});

export const bodyDataSchema = z.object({
  weight: z.coerce.number().min(30).max(400),
  target_weight: z.coerce.number().min(30).max(400),
  body_fat_percentage: z.coerce.number().min(2).max(70).optional().or(z.literal("")),
  waist: z.coerce.number().min(40).max(250).optional().or(z.literal("")),
  hip: z.coerce.number().min(40).max(250).optional().or(z.literal("")),
  chest: z.coerce.number().min(40).max(250).optional().or(z.literal("")),
  abdomen: z.coerce.number().min(40).max(250).optional().or(z.literal("")),
  arm: z.coerce.number().min(15).max(80).optional().or(z.literal("")),
  thigh: z.coerce.number().min(25).max(120).optional().or(z.literal("")),
  neck: z.coerce.number().min(20).max(80).optional().or(z.literal("")),
  shoulder: z.coerce.number().min(60).max(200).optional().or(z.literal("")),
});

export const healthSchema = z.object({
  medical_conditions: z.array(z.string()).default([]),
  injuries: safeText().optional(),
  surgeries: safeText().optional(),
  recurring_pain: safeText().optional(),
  allergies: safeText().optional(),
  dietary_restrictions: safeText().optional(),
  sleep_hours: z.coerce.number().min(2).max(14),
  stress_level: z.enum(["baixo", "medio", "alto"]),
});

export const medicationSchema = z.object({
  name: safeText(120).pipe(z.string().min(2, "Nome do medicamento")),
  dosage: safeText(60).optional(),
  frequency: safeText(60).optional(),
  reason: safeText(200).optional(),
  notes: safeText(500).optional(),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default([]),
});

export const dietSchema = z.object({
  breakfast: safeText(), lunch: safeText(), dinner: safeText(), snacks: safeText(),
  drinks: safeText(), sweets: safeText(), alcohol: safeText(),
  ultra_processed_food: safeText(), water_intake: safeText(100),
  food_preferences: safeText(), disliked_foods: safeText(),
});

export const trainingSchema = z.object({
  current_training: safeText(),
  frequency_per_week: z.coerce.number().min(0).max(14),
  experience_level: z.enum(["sedentario", "iniciante", "intermediario", "avancado", "atleta"]),
  activity_level: z.enum(["sedentario", "leve", "moderado", "muito_ativo", "atleta"]),
  available_times: safeText(200),
  available_equipment: z.array(z.string()).default([]),
  limitations: safeText().optional(),
});

export const goalSchema = z.object({
  goal_type: z.enum([
    "emagrecimento", "ganho_massa", "definicao", "performance",
    "saude_metabolica", "reducao_gordura_abdominal", "fisico_atletico", "recomposicao",
  ]),
  desired_body_description: safeText(1000),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  motivation: safeText(1000),
});

export const quickCheckinSchema = z.object({
  energy_level: z.coerce.number().min(1).max(5),
  diet_completed: z.boolean(),
  workout_completed: z.boolean(),
  slept_well: z.boolean(),
  medication_completed: z.boolean().nullable().optional(),
  symptoms: safeText(500).optional(),
  pain: safeText(500).optional(),
  notes: safeText(1000).optional(),
});

export const monthlyCheckinSchema = z.object({
  weight: z.coerce.number().min(30).max(400),
  waist: z.coerce.number().min(40).max(250).optional().or(z.literal("")),
  adherence_diet: z.coerce.number().min(0).max(100),
  adherence_training: z.coerce.number().min(0).max(100),
  energy_level: z.coerce.number().min(1).max(5),
  sleep_quality: z.coerce.number().min(1).max(5),
  stress_level: z.coerce.number().min(1).max(5),
  difficulties: safeText(1000).optional(),
  symptoms: safeText(1000).optional(),
  notes: safeText(1000).optional(),
});

export const GOAL_LABELS: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  ganho_massa: "Ganho de massa muscular",
  definicao: "Definição corporal",
  performance: "Performance esportiva",
  saude_metabolica: "Saúde metabólica",
  reducao_gordura_abdominal: "Redução de gordura abdominal",
  fisico_atletico: "Físico atlético",
  recomposicao: "Recomposição corporal",
};

export const EQUIPMENT_OPTIONS = [
  ["academia_completa", "Academia completa"],
  ["halteres", "Halteres"],
  ["peso_corporal", "Peso corporal"],
  ["elasticos", "Elásticos"],
  ["casa", "Em casa"],
  ["ar_livre", "Ao ar livre"],
  ["esteira", "Esteira"],
  ["bicicleta", "Bicicleta"],
  ["nenhum", "Nenhum equipamento"],
] as const;

export const CONDITION_OPTIONS = [
  ["pressao_alta", "Pressão alta"],
  ["diabetes_tipo_2", "Diabetes"],
  ["colesterol_alto", "Colesterol alto"],
  ["cardiopatia", "Problema cardíaco"],
  ["asma", "Asma / respiratório"],
  ["tireoide", "Tireoide"],
  ["nenhuma", "Nenhuma"],
] as const;
