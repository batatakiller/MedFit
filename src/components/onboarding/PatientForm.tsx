"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui";
import {
  BodyMeasurementsForm, DietForm, GoalSelector, HealthDataForm,
  MedicationsStep, PersonalDataForm, TrainingRoutineForm, type OnboardingData,
} from "./steps";

const steps = [
  "Dados pessoais", "Dados corporais", "Saúde", "Medicamentos",
  "Rotina alimentar", "Rotina de treino", "Objetivo físico",
] as const;

const initial: OnboardingData = {
  personal: { name: "", birth_date: "", sex: "", height: "" },
  body: {},
  health: {
    medical_conditions: [], injuries: "", surgeries: "", recurring_pain: "",
    allergies: "", dietary_restrictions: "", sleep_hours: "7", stress_level: "medio",
  },
  medications: [],
  diet: {},
  training: {
    current_training: "", frequency_per_week: "0", experience_level: "iniciante",
    activity_level: "sedentario", available_times: "", available_equipment: [], limitations: "",
  },
  goal: { goal_type: "", desired_body_description: "", target_date: "", motivation: "" },
};

export function PatientForm({ initialName }: { initialName?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...initial,
    personal: { ...initial.personal, name: initialName ?? "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (v?: string) => (v && v !== "" ? Number(v) : null);

  function validateStep(): string | null {
    if (step === 0) {
      const p = data.personal;
      if (!p.name || !p.birth_date || !p.sex || !p.height) return "Preencha nome, nascimento, sexo e altura.";
    }
    if (step === 1 && (!data.body.weight || !data.body.target_weight))
      return "Informe peso atual e peso desejado.";
    if (step === 6 && (!data.goal.goal_type || !data.goal.desired_body_description))
      return "Escolha o objetivo e descreva o corpo ideal.";
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) return setError(err);
    setError(null);
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");

    try {
      const p = data.personal;
      await supabase
        .from("profiles")
        .update({
          name: p.name, birth_date: p.birth_date, sex: p.sex,
          height: num(p.height),
          age: p.birth_date
            ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000)
            : null,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      await supabase.from("health_records").insert({
        user_id: user.id,
        weight: num(data.body.weight),
        target_weight: num(data.body.target_weight),
        body_fat_percentage: num(data.body.body_fat_percentage),
        activity_level: data.training.activity_level,
        stress_level: data.health.stress_level,
        sleep_hours: num(data.health.sleep_hours),
        main_goal: data.goal.goal_type || null,
        medical_conditions: data.health.medical_conditions,
        injuries: data.health.injuries || null,
        surgeries: data.health.surgeries || null,
        recurring_pain: data.health.recurring_pain || null,
        allergies: data.health.allergies || null,
        dietary_restrictions: data.health.dietary_restrictions || null,
      });

      await supabase.from("body_measurements").insert({
        user_id: user.id,
        weight: num(data.body.weight),
        waist: num(data.body.waist), hip: num(data.body.hip),
        chest: num(data.body.chest), abdomen: num(data.body.abdomen),
        arm: num(data.body.arm), thigh: num(data.body.thigh),
        neck: num(data.body.neck), shoulder: num(data.body.shoulder),
        body_fat_percentage: num(data.body.body_fat_percentage),
      });

      for (const m of data.medications.filter((m) => m.name.trim())) {
        const { data: med } = await supabase
          .from("medications")
          .insert({
            user_id: user.id, name: m.name.trim(),
            dosage: m.dosage || null, frequency: m.frequency || null, notes: m.notes || null,
          })
          .select("id")
          .single();
        const times = m.times.split(",").map((t) => t.trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t));
        if (med && times.length) {
          await supabase.from("medication_schedules").insert(
            times.map((t) => ({
              user_id: user.id, medication_id: med.id,
              scheduled_time: t.padStart(5, "0"),
            }))
          );
        }
      }

      await supabase.from("diet_logs").insert({
        user_id: user.id,
        breakfast: data.diet.breakfast || null, lunch: data.diet.lunch || null,
        dinner: data.diet.dinner || null, snacks: data.diet.snacks || null,
        drinks: data.diet.drinks || null, sweets: data.diet.sweets || null,
        alcohol: data.diet.alcohol || null,
        ultra_processed_food: data.diet.ultra_processed_food || null,
        water_intake: data.diet.water_intake || null,
        food_preferences: data.diet.food_preferences || null,
        disliked_foods: data.diet.disliked_foods || null,
      });

      await supabase.from("training_routines").insert({
        user_id: user.id,
        current_training: data.training.current_training || null,
        frequency_per_week: num(data.training.frequency_per_week),
        experience_level: data.training.experience_level,
        available_equipment: data.training.available_equipment,
        available_times: data.training.available_times || null,
        limitations: data.training.limitations || null,
      });

      await supabase.from("goals").insert({
        user_id: user.id,
        goal_type: data.goal.goal_type,
        desired_body_description: data.goal.desired_body_description,
        target_date: data.goal.target_date || null,
        motivation: data.goal.motivation || null,
      });

      router.push("/dashboard?onboarding=ok");
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Verifique a conexão e tente novamente.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-soft">
          <span>Etapa {step + 1} de {steps.length} — {steps[step]}</span>
          <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <ProgressBar value={((step + 1) / steps.length) * 100} />
      </div>

      <div className="card p-5 sm:p-6">
        {step === 0 && <PersonalDataForm value={data.personal} onChange={(v) => setData({ ...data, personal: v })} />}
        {step === 1 && <BodyMeasurementsForm value={data.body} onChange={(v) => setData({ ...data, body: v })} />}
        {step === 2 && <HealthDataForm value={data.health} onChange={(v) => setData({ ...data, health: v })} />}
        {step === 3 && <MedicationsStep value={data.medications} onChange={(v) => setData({ ...data, medications: v })} />}
        {step === 4 && <DietForm value={data.diet} onChange={(v) => setData({ ...data, diet: v })} />}
        {step === 5 && <TrainingRoutineForm value={data.training} onChange={(v) => setData({ ...data, training: v })} />}
        {step === 6 && <GoalSelector value={data.goal} onChange={(v) => setData({ ...data, goal: v })} />}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || saving}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button type="button" onClick={next} disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : step === steps.length - 1 ? (<><Check className="h-4 w-4" /> Concluir</>) : (<>Avançar <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </div>

      <p className="text-center text-xs text-ink-mute">
        Exames e fotos corporais podem ser enviados depois, nas áreas “Exames” e “Fotos corporais”.
      </p>
    </div>
  );
}
