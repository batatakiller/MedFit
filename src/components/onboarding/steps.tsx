"use client";

// Subformulários do onboarding — todos controlados pelo PatientForm.
// Componentes nomeados: HealthDataForm, BodyMeasurementsForm, DietForm,
// TrainingRoutineForm, GoalSelector (+ PersonalDataForm e MedicationsStep).

import { CONDITION_OPTIONS, EQUIPMENT_OPTIONS, GOAL_LABELS } from "@/lib/validators";
import { MedicationDisclaimer } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";

export type OnboardingData = {
  personal: { name: string; birth_date: string; sex: string; height: string };
  body: Record<string, string>;
  health: {
    medical_conditions: string[]; injuries: string; surgeries: string; recurring_pain: string;
    allergies: string; dietary_restrictions: string; sleep_hours: string; stress_level: string;
  };
  medications: { name: string; dosage: string; frequency: string; times: string; notes: string }[];
  diet: Record<string, string>;
  training: {
    current_training: string; frequency_per_week: string; experience_level: string;
    activity_level: string; available_times: string; available_equipment: string[]; limitations: string;
  };
  goal: { goal_type: string; desired_body_description: string; target_date: string; motivation: string };
};

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
);

export function PersonalDataForm({ value, onChange }: { value: OnboardingData["personal"]; onChange: (v: OnboardingData["personal"]) => void }) {
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <F label="Nome completo"><input className="input" value={value.name} onChange={(e) => set("name", e.target.value)} /></F>
      </div>
      <F label="Data de nascimento"><input type="date" className="input" value={value.birth_date} onChange={(e) => set("birth_date", e.target.value)} /></F>
      <F label="Sexo">
        <select className="input" value={value.sex} onChange={(e) => set("sex", e.target.value)}>
          <option value="">Selecione</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </F>
      <F label="Altura (cm)"><input type="number" className="input" placeholder="175" value={value.height} onChange={(e) => set("height", e.target.value)} /></F>
    </div>
  );
}

export function BodyMeasurementsForm({ value, onChange }: { value: OnboardingData["body"]; onChange: (v: OnboardingData["body"]) => void }) {
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  const fields: [string, string][] = [
    ["weight", "Peso atual (kg)"], ["target_weight", "Peso desejado (kg)"],
    ["body_fat_percentage", "% de gordura (se souber)"], ["waist", "Cintura (cm)"],
    ["hip", "Quadril (cm)"], ["chest", "Peitoral (cm)"], ["abdomen", "Abdômen (cm)"],
    ["arm", "Braço (cm)"], ["thigh", "Coxa (cm)"], ["neck", "Pescoço (cm)"], ["shoulder", "Ombros (cm)"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(([k, label]) => (
        <F key={k} label={label}>
          <input type="number" step="0.1" className="input" value={value[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
        </F>
      ))}
      <p className="text-xs text-ink-mute sm:col-span-2">
        Medidas opcionais ajudam a IA a calibrar o plano. As fotos de evolução são enviadas após o onboarding, em “Fotos corporais”.
      </p>
    </div>
  );
}

export function HealthDataForm({ value, onChange }: { value: OnboardingData["health"]; onChange: (v: OnboardingData["health"]) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v } as OnboardingData["health"]);
  const toggleCondition = (c: string) => {
    const has = value.medical_conditions.includes(c);
    let next = has ? value.medical_conditions.filter((x) => x !== c) : [...value.medical_conditions, c];
    if (c === "nenhuma" && !has) next = ["nenhuma"];
    else next = next.filter((x) => x !== "nenhuma" || c === "nenhuma");
    set("medical_conditions", next);
  };
  return (
    <div className="space-y-4">
      <F label="Histórico de doenças (marque o que se aplica)">
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map(([k, label]) => (
            <button
              type="button" key={k} onClick={() => toggleCondition(k)}
              className={`chip border px-3 py-1.5 text-sm transition ${
                value.medical_conditions.includes(k)
                  ? "border-brand-400 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-ink-soft hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </F>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Lesões"><input className="input" placeholder="Ex.: dor lombar, joelho..." value={value.injuries} onChange={(e) => set("injuries", e.target.value)} /></F>
        <F label="Cirurgias"><input className="input" value={value.surgeries} onChange={(e) => set("surgeries", e.target.value)} /></F>
        <F label="Dores recorrentes"><input className="input" value={value.recurring_pain} onChange={(e) => set("recurring_pain", e.target.value)} /></F>
        <F label="Alergias"><input className="input" value={value.allergies} onChange={(e) => set("allergies", e.target.value)} /></F>
        <F label="Restrições alimentares"><input className="input" placeholder="Ex.: lactose, glúten..." value={value.dietary_restrictions} onChange={(e) => set("dietary_restrictions", e.target.value)} /></F>
        <F label="Horas de sono por noite"><input type="number" step="0.5" className="input" value={value.sleep_hours} onChange={(e) => set("sleep_hours", e.target.value)} /></F>
        <F label="Nível de estresse">
          <select className="input" value={value.stress_level} onChange={(e) => set("stress_level", e.target.value)}>
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
          </select>
        </F>
      </div>
    </div>
  );
}

export function MedicationsStep({ value, onChange }: { value: OnboardingData["medications"]; onChange: (v: OnboardingData["medications"]) => void }) {
  const add = () => onChange([...value, { name: "", dosage: "", frequency: "", times: "", notes: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const set = (i: number, k: string, v: string) =>
    onChange(value.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  return (
    <div className="space-y-4">
      <MedicationDisclaimer />
      <p className="text-sm text-ink-soft">
        Cadastre apenas medicamentos que você <b>já usa por orientação médica</b> — o app vai
        registrar e lembrar os horários que você informar.
      </p>
      {value.map((m, i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Medicamento {i + 1}</p>
            <button type="button" onClick={() => remove(i)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Nome"><input className="input" value={m.name} onChange={(e) => set(i, "name", e.target.value)} /></F>
            <F label="Dosagem (informada por você)"><input className="input" placeholder="Ex.: 50mg" value={m.dosage} onChange={(e) => set(i, "dosage", e.target.value)} /></F>
            <F label="Frequência"><input className="input" placeholder="Ex.: 2x ao dia" value={m.frequency} onChange={(e) => set(i, "frequency", e.target.value)} /></F>
            <F label="Horários (separados por vírgula)"><input className="input" placeholder="08:00, 20:00" value={m.times} onChange={(e) => set(i, "times", e.target.value)} /></F>
          </div>
          <F label="Observações"><input className="input" value={m.notes} onChange={(e) => set(i, "notes", e.target.value)} /></F>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-secondary w-full">
        <Plus className="h-4 w-4" /> Adicionar medicamento
      </button>
    </div>
  );
}

export function DietForm({ value, onChange }: { value: OnboardingData["diet"]; onChange: (v: OnboardingData["diet"]) => void }) {
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  const fields: [string, string, string][] = [
    ["breakfast", "Café da manhã", "O que você costuma comer?"],
    ["lunch", "Almoço", ""],
    ["dinner", "Jantar", ""],
    ["snacks", "Lanches", ""],
    ["drinks", "Bebidas", "Refrigerante, suco, café..."],
    ["sweets", "Consumo de doces", "Frequência"],
    ["alcohol", "Consumo de álcool", "Frequência"],
    ["ultra_processed_food", "Ultraprocessados", "Frequência"],
    ["water_intake", "Consumo de água", "Ex.: ~1,5L por dia"],
    ["food_preferences", "Preferências alimentares", "O que você gosta"],
    ["disliked_foods", "Alimentos que não gosta", ""],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(([k, label, ph]) => (
        <F key={k} label={label}>
          <input className="input" placeholder={ph} value={value[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
        </F>
      ))}
    </div>
  );
}

export function TrainingRoutineForm({ value, onChange }: { value: OnboardingData["training"]; onChange: (v: OnboardingData["training"]) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v } as OnboardingData["training"]);
  const toggleEquip = (k: string) => {
    const has = value.available_equipment.includes(k);
    set("available_equipment", has ? value.available_equipment.filter((x) => x !== k) : [...value.available_equipment, k]);
  };
  return (
    <div className="space-y-4">
      <F label="Rotina de treino atual"><textarea className="input min-h-20" placeholder="Descreva o que você treina hoje (ou 'nenhum treino')" value={value.current_training} onChange={(e) => set("current_training", e.target.value)} /></F>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Frequência semanal de treino"><input type="number" min={0} max={14} className="input" value={value.frequency_per_week} onChange={(e) => set("frequency_per_week", e.target.value)} /></F>
        <F label="Nível de experiência">
          <select className="input" value={value.experience_level} onChange={(e) => set("experience_level", e.target.value)}>
            {["sedentario", "iniciante", "intermediario", "avancado", "atleta"].map((o) => (
              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
            ))}
          </select>
        </F>
        <F label="Nível de atividade física (dia a dia)">
          <select className="input" value={value.activity_level} onChange={(e) => set("activity_level", e.target.value)}>
            <option value="sedentario">Sedentário</option>
            <option value="leve">Levemente ativo</option>
            <option value="moderado">Moderadamente ativo</option>
            <option value="muito_ativo">Muito ativo</option>
            <option value="atleta">Atleta</option>
          </select>
        </F>
        <F label="Horários disponíveis para treinar"><input className="input" placeholder="Ex.: manhã 6h-7h" value={value.available_times} onChange={(e) => set("available_times", e.target.value)} /></F>
      </div>
      <F label="Equipamentos disponíveis">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map(([k, label]) => (
            <button
              type="button" key={k} onClick={() => toggleEquip(k)}
              className={`chip border px-3 py-1.5 text-sm transition ${
                value.available_equipment.includes(k)
                  ? "border-tech-400 bg-tech-50 text-tech-800"
                  : "border-slate-200 bg-white text-ink-soft hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </F>
      <F label="Limitações físicas"><input className="input" placeholder="Ex.: evitar impacto no joelho" value={value.limitations} onChange={(e) => set("limitations", e.target.value)} /></F>
    </div>
  );
}

export function GoalSelector({ value, onChange }: { value: OnboardingData["goal"]; onChange: (v: OnboardingData["goal"]) => void }) {
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <F label="Objetivo principal">
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(GOAL_LABELS).map(([k, label]) => (
            <button
              type="button" key={k} onClick={() => set("goal_type", k)}
              className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${
                value.goal_type === k
                  ? "border-brand-400 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-ink-soft hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </F>
      <F label="Descreva o corpo ideal que você quer alcançar">
        <textarea className="input min-h-24" placeholder="Ex.: reduzir barriga, braços mais fortes, abdômen definido..." value={value.desired_body_description} onChange={(e) => set("desired_body_description", e.target.value)} />
      </F>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Prazo estimado"><input type="date" className="input" value={value.target_date} onChange={(e) => set("target_date", e.target.value)} /></F>
        <F label="Motivação pessoal"><input className="input" placeholder="O que te move?" value={value.motivation} onChange={(e) => set("motivation", e.target.value)} /></F>
      </div>
    </div>
  );
}
