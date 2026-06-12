import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PatientContext } from "@/lib/ai/types";
import {
  ageFromBirthDate, calcBMR, calcIMC, calcTDEE, calcTargetCalories, calcWaterGoalMl,
} from "@/lib/calculations";

// Monta o contexto completo do paciente para o grafo multiagente.
// Usa o client com sessão do usuário → RLS garante que só lê os próprios dados.
export async function buildPatientContext(
  sb: SupabaseClient,
  userId: string
): Promise<PatientContext> {
  const [profileQ, healthQ, goalQ, dietQ, trainingQ, medsQ, measQ, scanQ] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", userId).single(),
    sb.from("health_records").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("goals").select("*").eq("user_id", userId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("diet_logs").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("training_routines").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("medications").select("name, dosage, frequency").eq("user_id", userId).eq("active", true),
    sb.from("body_measurements").select("*").eq("user_id", userId)
      .order("measurement_date", { ascending: false }).limit(2),
    sb.from("body_scan_sessions")
      .select("scan_date, confidence_score, body_fat_estimate, margin_of_error, body_scan_reports(body_composition_analysis, posture_analysis)")
      .eq("user_id", userId).eq("status", "concluido")
      .order("scan_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const profile = profileQ.data;
  const health = healthQ.data;
  const goal = goalQ.data;
  const diet = dietQ.data;
  const training = trainingQ.data;
  const meas = measQ.data ?? [];
  const cur = meas[0] ?? null;
  const prev = meas[1] ?? null;

  const age = profile?.age ?? ageFromBirthDate(profile?.birth_date) ?? null;
  const weight = cur?.weight ?? health?.weight ?? null;
  const height = profile?.height ?? null;
  const imc = calcIMC(weight, height);
  const bmr = calcBMR({ weightKg: weight, heightCm: height, age, sex: profile?.sex });
  const tdee = calcTDEE(bmr, health?.activity_level);
  const targetCalories = calcTargetCalories(tdee, goal?.goal_type);

  const toMeas = (m: typeof cur) =>
    m
      ? {
          weight: m.weight, waist: m.waist, hip: m.hip, chest: m.chest,
          abdomen: m.abdomen, arm: m.arm, thigh: m.thigh, neck: m.neck, shoulder: m.shoulder,
        }
      : null;

  let bodyScanSummary: string | null = null;
  if (scanQ.data) {
    const s = scanQ.data;
    bodyScanSummary =
      `Scan corporal de ${s.scan_date}: gordura estimada ${s.body_fat_estimate ?? "?"}% ` +
      `(confiança ${Math.round((s.confidence_score ?? 0) * 100)}%, erro ${s.margin_of_error ?? "n/d"}).`;
  }

  return {
    userId,
    name: profile?.name ?? "Paciente",
    age,
    sex: profile?.sex ?? null,
    heightCm: height,
    weightKg: weight,
    targetWeightKg: health?.target_weight ?? null,
    imc,
    bodyFatPct: cur?.body_fat_percentage ?? health?.body_fat_percentage ?? null,
    goalType: goal?.goal_type ?? health?.main_goal ?? null,
    goalDescription: goal?.desired_body_description ?? null,
    goalDeadline: goal?.target_date ?? null,
    motivation: goal?.motivation ?? null,
    medicalConditions: health?.medical_conditions ?? [],
    injuries: health?.injuries ?? null,
    allergies: health?.allergies ?? null,
    dietaryRestrictions: health?.dietary_restrictions ?? null,
    sleepHours: health?.sleep_hours ?? null,
    stressLevel: health?.stress_level ?? null,
    activityLevel: health?.activity_level ?? null,
    experienceLevel: training?.experience_level ?? null,
    trainingFrequency: training?.frequency_per_week ?? null,
    availableEquipment: training?.available_equipment ?? [],
    availableTimes: training?.available_times ?? null,
    limitations: training?.limitations ?? null,
    currentDiet: {
      cafe_da_manha: diet?.breakfast ?? null,
      almoco: diet?.lunch ?? null,
      jantar: diet?.dinner ?? null,
      lanches: diet?.snacks ?? null,
      bebidas: diet?.drinks ?? null,
      doces: diet?.sweets ?? null,
      alcool: diet?.alcohol ?? null,
      ultra_processed_food: diet?.ultra_processed_food ?? null,
      water_intake: diet?.water_intake ?? null,
      preferencias: diet?.food_preferences ?? null,
      nao_gosta: diet?.disliked_foods ?? null,
    },
    medications: (medsQ.data ?? []).map((m) => ({
      name: m.name, dosage: m.dosage, frequency: m.frequency,
    })),
    examFindings: null, // preenchido pelo ExamAnalysisNode
    measurements: toMeas(cur) ?? {},
    previousMeasurements: toMeas(prev),
    bodyScanSummary,
    tdee,
    targetCalories,
    waterGoalMl: calcWaterGoalMl(weight),
  };
}
