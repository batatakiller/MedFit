// Mock multiagente — usado quando a API de IA real ainda não está conectada.
// Gera uma avaliação completa, coerente e SEGURA a partir de regras sobre o
// perfil do paciente (risco clínico, nível de experiência, objetivo).

import type {
  AgentSection, AgentMessage, BodyVisionSection, DailyMobilePlan,
  IntegratedPlanSection, NutritionSection, PatientContext, SafetyValidation,
  TrainerSection, WorkoutDay,
} from "./types";
import { GOAL_LABELS } from "@/lib/validators";

export function hasClinicalRisk(p: PatientContext) {
  return (
    p.medicalConditions.some((c) => c !== "nenhuma") ||
    p.medications.length > 0 ||
    (p.imc ?? 0) >= 30 ||
    Boolean(p.injuries && p.injuries.toLowerCase() !== "nenhuma")
  );
}

export function mockDoctor(p: PatientContext): AgentSection & { risk_level: string } {
  const risk = hasClinicalRisk(p);
  const conds = p.medicalConditions.filter((c) => c !== "nenhuma");
  const condTxt = conds.length ? conds.join(", ").replace(/_/g, " ") : "sem condições clínicas relatadas";
  return {
    analysis:
      `Paciente de ${p.age ?? "?"} anos, IMC ${p.imc ?? "?"} ` +
      `(${p.weightKg ?? "?"}kg / ${p.heightCm ?? "?"}cm), nível de atividade ${p.activityLevel ?? "não informado"}, ` +
      `${condTxt}${p.medications.length ? `, em uso de ${p.medications.length} medicamento(s) cadastrado(s) pelo próprio paciente` : ""}. ` +
      (risk
        ? "Há fatores de risco relevantes: a progressão de treino e dieta deve ser lenta, monitorada e validada presencialmente."
        : "Perfil de baixo risco aparente para treino progressivo, mantendo acompanhamento preventivo."),
    recommendations: [
      ...(risk
        ? [
            "Validação médica presencial ANTES de aumentar a intensidade dos treinos",
            "Monitorar sinais e sintomas conforme orientação do seu médico",
          ]
        : ["Check-up periódico preventivo é recomendado"]),
      "Hidratação adequada e sono de 7h+ como base de segurança",
      "Interromper exercício e procurar atendimento em caso de dor no peito, tontura ou falta de ar",
    ],
    warnings: [
      "O Med Fit não substitui consulta médica e não prescreve, altera ou suspende medicamentos.",
      ...(p.medications.length ? ["Medicamentos devem ser definidos e acompanhados exclusivamente pelo seu médico."] : []),
    ],
    risk_level: risk ? ((p.imc ?? 0) >= 35 || conds.length >= 2 ? "alto" : "moderado") : "baixo",
  };
}

export function mockNutritionist(p: PatientContext, risk: boolean): NutritionSection {
  const cal = p.targetCalories ?? 2000;
  const protein = Math.round((p.weightKg ?? 70) * 1.8);
  const fats = Math.round((cal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((cal - protein * 4 - fats * 9) / 4));
  const losing = ["emagrecimento", "reducao_gordura_abdominal", "saude_metabolica", "definicao"].includes(p.goalType ?? "");
  return {
    analysis:
      `Dieta atual com pontos a melhorar (${summarizeDiet(p)}). ` +
      `Necessidade estimada: ~${cal} kcal/dia (gasto estimado ${p.tdee ?? "?"} kcal), proteína ~${protein}g/dia, água ${p.waterGoalMl}ml.`,
    strategy: risk
      ? `Como há condições clínicas/medicamentos, a estratégia é ${losing ? "déficit calórico MODERADO (~500 kcal)" : "ajuste calórico leve"}, rica em fibras e proteína, reduzindo ultraprocessados gradualmente — sempre com validação de nutricionista presencial.`
      : losing
        ? "Déficit calórico moderado com proteína alta para preservar massa magra e fibras para saciedade."
        : "Leve superávit calórico com proteína ~1,8g/kg para construção muscular com mínimo ganho de gordura.",
    meal_plan: {
      breakfast: ["Ovos (2-3) com legumes", "1 fonte de carboidrato integral", "1 fruta", "Café/chá sem açúcar"],
      lunch: ["Proteína magra (150-180g)", "Arroz integral ou batata", "Feijão/lentilha", "Salada à vontade com azeite"],
      dinner: losing ? ["Versão menor do almoço ou sopa proteica", "Vegetais à vontade"] : ["Prato completo com proteína e carboidrato", "Vegetais"],
      snacks: ["Iogurte natural com fruta", "Castanhas (1 punhado)", ...(losing ? [] : ["Pós-treino: fruta + fonte proteica"])],
    },
    recommendations: [
      "Trocar bebidas açucaradas por água ou água com gás",
      `Beber ${(p.waterGoalMl / 1000).toFixed(1).replace(".", ",")}L de água por dia`,
      "Reduzir ultraprocessados de forma gradual e sustentável",
      ...(p.dietaryRestrictions && p.dietaryRestrictions !== "Nenhuma" ? [`Respeitar restrições informadas: ${p.dietaryRestrictions}`] : []),
    ],
    warnings: risk
      ? ["Plano alimentar educacional: com diabetes, hipertensão ou obesidade, valide com nutricionista presencial."]
      : ["Plano alimentar é orientação educacional — para ajuste fino, procure nutricionista presencial."],
    calories_estimate: cal,
    protein, carbs, fats,
  };
}

function summarizeDiet(p: PatientContext) {
  const flags: string[] = [];
  const d = p.currentDiet;
  const has = (k: string, words: string[]) =>
    words.some((w) => (d[k] ?? "").toLowerCase().includes(w));
  if (has("drinks", ["refrigerante"]) || has("sweets", ["todo dia", "diariamente"])) flags.push("excesso de açúcar");
  if (has("ultra_processed_food", ["todos os dias", "quase", "diaria"])) flags.push("ultraprocessados frequentes");
  if (has("water_intake", ["1l", "1 l", "pouca"])) flags.push("hidratação baixa");
  if (!flags.length) flags.push("estrutura razoável com espaço para mais proteína e fibras");
  return flags.join(", ");
}

export function mockTrainer(p: PatientContext, risk: boolean): TrainerSection {
  const sedentary = p.experienceLevel === "sedentario" || (p.trainingFrequency ?? 0) === 0;
  const gym = p.availableEquipment.includes("academia_completa");
  const weekly: WorkoutDay[] = sedentary || risk ? beginnerSafePlan() : gym ? hypertrophyABC() : homePlan();
  return {
    analysis: sedentary || risk
      ? "Ponto de partida conservador: condicionamento de base com caminhada, mobilidade e força leve, evoluindo volume antes de intensidade."
      : `Nível ${p.experienceLevel}: treino estruturado ${gym ? "com academia completa" : "com os equipamentos disponíveis"}, foco no objetivo de ${GOAL_LABELS[p.goalType ?? ""] ?? "evolução física"}.`,
    weekly_plan: weekly,
    progression: sedentary || risk
      ? "Mês 1: técnica e constância (volume baixo). Mês 2: +10-15% de volume. Intensidade só aumenta após liberação médica presencial e ausência de sintomas."
      : "Progressão dupla: ao atingir o teto de repetições em todas as séries, aumentar 2,5-5% a carga. Reavaliar volume mensalmente.",
    recommendations: [
      "Aquecer 5-10 minutos antes de todo treino",
      "Registrar cargas e dificuldade percebida no app",
      "Dormir 7h+ para recuperação",
      ...(p.limitations ? [`Respeitar limitações informadas: ${p.limitations}`] : []),
    ],
    warnings: [
      "Interrompa o treino imediatamente em caso de dor no peito, tontura, falta de ar intensa, dor aguda ou mal-estar.",
      ...(risk ? ["Evite treinos até a exaustão antes da validação médica presencial."] : []),
    ],
  };
}

function beginnerSafePlan(): WorkoutDay[] {
  return [
    { day: "seg", name: "Caminhada + Mobilidade", goal: "Base aeróbica", duration: "35min", warmup: "5min caminhada leve",
      exercises: [
        { name: "Caminhada em ritmo confortável", sets: 1, reps: "25min", rest: 0 },
        { name: "Mobilidade de quadril", sets: 2, reps: "10", rest: 30 },
        { name: "Alongamento gato-vaca", sets: 2, reps: "10", rest: 30 },
      ] },
    { day: "qua", name: "Força leve (corpo todo)", goal: "Adaptação", duration: "30min", warmup: "8min caminhada + mobilidade",
      exercises: [
        { name: "Agachamento no banco", sets: 2, reps: "10-12", rest: 90 },
        { name: "Remada com elástico", sets: 2, reps: "12", rest: 90 },
        { name: "Elevação de panturrilha", sets: 2, reps: "15", rest: 60 },
        { name: "Prancha (joelhos)", sets: 2, reps: "20s", rest: 60 },
      ] },
    { day: "sex", name: "Caminhada + Core", goal: "Gasto calórico", duration: "35min", warmup: "5min leve",
      exercises: [
        { name: "Caminhada", sets: 1, reps: "25min", rest: 0 },
        { name: "Abdominal curto", sets: 2, reps: "10", rest: 60 },
        { name: "Alongamento geral", sets: 1, reps: "5min", rest: 0 },
      ] },
  ];
}

function hypertrophyABC(): WorkoutDay[] {
  return [
    { day: "seg", name: "A — Peito/Ombro/Tríceps", goal: "Hipertrofia", duration: "55min", warmup: "5min esteira + séries leves",
      exercises: [
        { name: "Supino reto", sets: 3, reps: "8-12", rest: 90 },
        { name: "Supino inclinado halteres", sets: 3, reps: "10-12", rest: 90 },
        { name: "Desenvolvimento halteres", sets: 3, reps: "10-12", rest: 90 },
        { name: "Elevação lateral", sets: 3, reps: "12-15", rest: 60 },
        { name: "Tríceps corda", sets: 3, reps: "10-12", rest: 60 },
      ] },
    { day: "ter", name: "B — Costas/Bíceps", goal: "Hipertrofia", duration: "55min", warmup: "5min remo + barra leve",
      exercises: [
        { name: "Puxada frontal", sets: 3, reps: "8-12", rest: 90 },
        { name: "Remada curvada", sets: 3, reps: "8-12", rest: 90 },
        { name: "Remada baixa", sets: 3, reps: "10-12", rest: 90 },
        { name: "Rosca direta", sets: 3, reps: "10-12", rest: 60 },
      ] },
    { day: "qui", name: "C — Pernas/Core", goal: "Hipertrofia", duration: "60min", warmup: "5min bike + agachamento livre",
      exercises: [
        { name: "Agachamento livre", sets: 3, reps: "8-12", rest: 120 },
        { name: "Leg press", sets: 3, reps: "10-12", rest: 90 },
        { name: "Terra romeno", sets: 3, reps: "8-10", rest: 120 },
        { name: "Prancha", sets: 3, reps: "40s", rest: 60 },
      ] },
    { day: "sex", name: "Full upper leve + abdômen", goal: "Volume extra", duration: "45min", warmup: "5min esteira",
      exercises: [
        { name: "Supino máquina", sets: 3, reps: "10-12", rest: 90 },
        { name: "Crucifixo", sets: 3, reps: "12", rest: 60 },
        { name: "Abdominal infra", sets: 3, reps: "12-15", rest: 60 },
      ] },
  ];
}

function homePlan(): WorkoutDay[] {
  return [
    { day: "seg", name: "Corpo todo A (casa)", goal: "Força geral", duration: "40min", warmup: "5min polichinelo leve + mobilidade",
      exercises: [
        { name: "Agachamento livre", sets: 3, reps: "12-15", rest: 60 },
        { name: "Flexão de braço (adaptada se preciso)", sets: 3, reps: "8-12", rest: 90 },
        { name: "Remada com elástico", sets: 3, reps: "12", rest: 60 },
        { name: "Prancha", sets: 3, reps: "30s", rest: 60 },
      ] },
    { day: "qua", name: "Cardio + Core", goal: "Condicionamento", duration: "35min", warmup: "5min leve",
      exercises: [
        { name: "Caminhada rápida/corrida leve", sets: 1, reps: "25min", rest: 0 },
        { name: "Abdominal curto", sets: 3, reps: "12", rest: 45 },
      ] },
    { day: "sex", name: "Corpo todo B (casa)", goal: "Força geral", duration: "40min", warmup: "5min mobilidade",
      exercises: [
        { name: "Afundo", sets: 3, reps: "10/perna", rest: 60 },
        { name: "Elevação de quadril", sets: 3, reps: "15", rest: 60 },
        { name: "Flexão pegada fechada", sets: 3, reps: "8-10", rest: 90 },
        { name: "Prancha lateral", sets: 2, reps: "20s/lado", rest: 45 },
      ] },
  ];
}

export function mockBodyVision(p: PatientContext): BodyVisionSection {
  const m = p.measurements;
  const prev = p.previousMeasurements;
  const abdominalFocus = (m.waist ?? 0) > 0 && (m.waist ?? 0) >= 94;
  return {
    analysis: p.bodyScanSummary
      ? `${p.bodyScanSummary} Interpretação: ${abdominalFocus ? "maior acúmulo de gordura na região abdominal (padrão a acompanhar por cintura e abdômen)" : "distribuição corporal sem concentração crítica aparente"}, massa muscular aparente ${(p.imc ?? 25) < 22 ? "baixa — bom potencial de resposta a treino de força" : "a desenvolver com treino progressivo"}.`
      : "Sem fotos processadas nesta avaliação. Estimativas abaixo derivam apenas das medidas manuais informadas. Envie fotos (frente, costas e perfis) para análise visual completa.",
    estimated_measurements: {
      cintura_cm: m.waist ?? "não informado",
      abdomen_cm: m.abdomen ?? "não informado",
      quadril_cm: m.hip ?? "não informado",
      torax_cm: m.chest ?? "não informado",
      braco_cm: m.arm ?? "não informado",
      coxa_cm: m.thigh ?? "não informado",
    },
    body_composition_estimate: {
      gordura_corporal_pct: p.bodyFatPct ?? estimateBodyFat(p) ?? "indeterminado",
      classificacao: abdominalFocus ? "gordura predominantemente abdominal" : "distribuição uniforme",
    },
    posture_analysis: {
      observacao: p.bodyScanSummary
        ? "Alinhamento geral dentro do esperado nos landmarks; revisar ombros/pelve em avaliação presencial se houver dor."
        : "Postura não avaliada (sem fotos).",
    },
    confidence_level: p.bodyScanSummary ? "média" : "baixa",
    margin_of_error: "±3-5% no percentual de gordura; ±2-4cm nas circunferências estimadas",
    recommendations: [
      "Refazer fotos mensalmente com mesma roupa, distância, pose e iluminação",
      "Comparar evolução por cintura, abdômen, peso e fotos padronizadas",
      "Para precisão, considerar bioimpedância, adipometria ou DEXA",
      ...(prev ? [compareTrend(m, prev)] : []),
    ],
  };
}

function estimateBodyFat(p: PatientContext): number | null {
  // Deurenberg (estimativa grosseira a partir de IMC/idade/sexo)
  if (!p.imc || !p.age) return null;
  const sexFactor = p.sex === "feminino" ? 0 : 1;
  return Math.round((1.2 * p.imc + 0.23 * p.age - 10.8 * sexFactor - 5.4) * 10) / 10;
}

function compareTrend(cur: Record<string, number | null>, prev: Record<string, number | null>) {
  const dWaist = cur.waist != null && prev.waist != null ? cur.waist - prev.waist : null;
  const dWeight = cur.weight != null && prev.weight != null ? cur.weight - prev.weight : null;
  const parts: string[] = [];
  if (dWeight != null) parts.push(`peso ${dWeight > 0 ? "+" : ""}${dWeight.toFixed(1)}kg`);
  if (dWaist != null) parts.push(`cintura ${dWaist > 0 ? "+" : ""}${dWaist.toFixed(1)}cm`);
  return parts.length ? `Tendência vs. avaliação anterior: ${parts.join(", ")}` : "Sem base anterior para comparação";
}

export function mockDiscussion(p: PatientContext, risk: boolean): AgentMessage[] {
  return [
    { agent: "medico_esporte", message: risk
        ? `Paciente apresenta ${p.medicalConditions.filter((c) => c !== "nenhuma").join(" e ").replace(/_/g, " ") || "fatores de risco"}${p.medications.length ? " e usa medicamentos cadastrados" : ""}. Recomendo abordagem progressiva, monitoramento de sintomas e validação médica presencial antes de treinos intensos.`
        : "Sem fatores de risco relevantes identificados. Liberado para progressão estruturada, mantendo atenção preventiva a sintomas." },
    { agent: "nutricionista", message: risk
        ? "Com base no risco metabólico, a dieta começa com ajuste calórico moderado, alto consumo de fibras, proteína adequada e redução gradual de ultraprocessados."
        : "Estratégia calórica alinhada ao objetivo, com proteína ~1,8g/kg e hidratação reforçada." },
    { agent: "treinador", message: risk
        ? "Considerando o quadro clínico, inicio com caminhada, mobilidade e musculação leve, evoluindo volume mensalmente antes de intensidade."
        : "Plano de força progressivo conforme o nível atual, com sobrecarga gradual e técnica em primeiro lugar." },
    { agent: "body_vision", message: p.bodyScanSummary
        ? "As fotos indicam os pontos de acompanhamento visual: cintura/abdômen e simetria. Evolução será medida por fotos padronizadas mensais + medidas."
        : "Sem fotos nesta rodada: acompanharemos por medidas manuais e peso, e recomendo enviar fotos padronizadas no próximo check-in." },
    { agent: "medico_esporte", message: "De acordo com a estratégia do nutricionista e do treinador — manter déficits/intensidades moderados é compatível com o quadro." },
    { agent: "supervisor", message: risk
        ? "Plano aprovado com foco inicial em segurança: perda de gordura gradual, melhora metabólica e construção progressiva de condicionamento. Reavaliação em 30 dias e acompanhamento profissional presencial recomendado."
        : "Plano aprovado: estratégia integrada e progressiva, com reavaliação mensal de medidas, fotos e adesão." },
  ];
}

export function mockSafety(p: PatientContext, risk: boolean): SafetyValidation {
  return {
    is_safe: true,
    warnings: [
      "Toda orientação é educacional e não substitui profissionais de saúde presenciais.",
      ...(risk ? ["Plano calibrado para perfil de risco: não aumentar intensidade sem validação médica presencial."] : []),
      ...(p.medications.length ? ["Medicamentos: o app apenas registra e lembra horários informados. Não altere nada sem seu médico."] : []),
    ],
    requires_professional_followup: risk,
    reason: risk
      ? "Condições clínicas e/ou medicamentos cadastrados exigem acompanhamento médico e nutricional presencial."
      : "Perfil de baixo risco; acompanhamento presencial recomendado como boa prática.",
  };
}

export function mockIntegrated(p: PatientContext, risk: boolean): IntegratedPlanSection & {
  summary: string; current_condition: string; main_goal: string; risk_alerts: string[]; confidence_score: number;
} {
  const goal = GOAL_LABELS[p.goalType ?? ""] ?? "Evolução física";
  return {
    summary: `Estratégia integrada para ${goal.toLowerCase()}: ${risk ? "fase 1 focada em segurança, hábito e progressão lenta" : "treino estruturado com nutrição alinhada ao objetivo"}, com reavaliação mensal por medidas, fotos e adesão.`,
    current_condition: `IMC ${p.imc ?? "?"}, peso ${p.weightKg ?? "?"}kg (meta ${p.targetWeightKg ?? "?"}kg), nível ${p.experienceLevel ?? "?"}, ${risk ? "com fatores clínicos a respeitar" : "sem fatores clínicos relevantes relatados"}.`,
    main_goal: goal,
    risk_alerts: [
      ...(risk ? ["Validação presencial obrigatória antes de intensificar treinos", "Não alterar medicamentos por conta própria"] : []),
      "Interromper exercício diante de dor no peito, tontura ou falta de ar",
    ],
    next_30_days: risk
      ? "Fase 1 — Segurança e hábito: 3 sessões/semana leves, ajuste alimentar moderado, hidratação e sono. Sem intensidade alta até liberação médica."
      : "Ciclo 1 — Base: executar o plano semanal completo, bater meta de proteína e água, registrar cargas e refeições no app.",
    monthly_goals: risk
      ? ["-2 a -3kg", "-2cm de cintura", "12 sessões no mês", "Água 2L+/dia em 25 dias"]
      : ["Cumprir 90% dos treinos", "Meta de proteína diária em 25 dias", "Progredir carga nos exercícios-base", "Fotos + medidas no dia 30"],
    habits: ["Água ao acordar", "Proteína em todas as refeições", "Dormir no horário definido", "Check-in diário no app"],
    metrics_to_track: ["peso", "cintura", "abdômen", "adesão a treino e dieta", "energia", "sono", "fotos mensais"],
    next_checkin: "30 dias",
    confidence_score: p.bodyScanSummary ? 0.8 : 0.72,
  };
}

export function mockDailyPlan(p: PatientContext, trainer: TrainerSection, nutrition: NutritionSection): DailyMobilePlan {
  const todayIdx = new Date().getDay(); // 0=dom
  const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const today = trainer.weekly_plan.find((d) => d.day === dayKeys[todayIdx]);
  return {
    today_summary: today
      ? `Hoje: ${today.name} (${today.duration}) + plano alimentar e meta de água.`
      : "Hoje é dia de descanso ativo: caminhada leve opcional, foco em dieta, água e sono.",
    workout_today: today
      ? [{ title: today.name, description: `${today.goal} — ${today.exercises.length} exercícios, ${today.duration}` }]
      : [{ title: "Descanso ativo", description: "Caminhada leve de 15-20min opcional + alongamento" }],
    meals_today: [
      { meal_type: "cafe", title: "Café da manhã", description: nutrition.meal_plan.breakfast.join(", ") },
      { meal_type: "almoco", title: "Almoço", description: nutrition.meal_plan.lunch.join(", ") },
      { meal_type: "lanche", title: "Lanche", description: nutrition.meal_plan.snacks.join(", ") },
      { meal_type: "jantar", title: "Jantar", description: nutrition.meal_plan.dinner.join(", ") },
    ],
    water_goal_ml: p.waterGoalMl,
    medication_reminders: p.medications.map(
      (m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` — ${m.frequency}` : ""} (horários conforme você cadastrou)`
    ),
    daily_checklist: [
      "Beber a meta de água",
      today ? "Concluir o treino de hoje" : "Fazer caminhada leve (opcional)",
      "Marcar as refeições realizadas",
      ...(p.medications.length ? ["Confirmar medicamentos cadastrados"] : []),
      "Fazer o check-in rápido à noite",
    ],
  };
}
