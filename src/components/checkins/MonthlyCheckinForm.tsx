"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { monthlyCheckinSchema } from "@/lib/validators";

const Range = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <label className="label">{label}: <b>{value}/5</b></label>
    <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-600" />
  </div>
);

export function MonthlyCheckinForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    weight: "", waist: "", adherence_diet: 70, adherence_training: 70,
    energy_level: 3, sleep_quality: 3, stress_level: 3,
    difficulties: "", symptoms: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const parsed = monthlyCheckinSchema.safeParse(form);
    if (!parsed.success) {
      setError("Informe ao menos o peso atual (entre 30 e 400kg).");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const d = parsed.data;
    await supabase.from("monthly_checkins").insert({
      user_id: user.id,
      weight: d.weight,
      waist: d.waist === "" ? null : d.waist,
      adherence_diet: d.adherence_diet,
      adherence_training: d.adherence_training,
      energy_level: d.energy_level,
      sleep_quality: d.sleep_quality,
      stress_level: d.stress_level,
      difficulties: d.difficulties || null,
      symptoms: d.symptoms || null,
      notes: d.notes || null,
    });
    // o peso/cintura do check-in mensal viram nova medição
    await supabase.from("body_measurements").insert({
      user_id: user.id,
      weight: d.weight,
      waist: d.waist === "" ? null : d.waist,
    });

    // dispara reavaliação multiagente com os dados novos
    await fetch("/api/ai/assessment", { method: "POST" }).catch(() => null);

    setSaving(false);
    router.push("/plano");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="label">Peso atual (kg) *</label>
          <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
        <div>
          <label className="label">Cintura (cm)</label>
          <input type="number" step="0.1" className="input" value={form.waist} onChange={(e) => set("waist", e.target.value)} />
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div>
          <label className="label">Adesão à dieta: <b>{form.adherence_diet}%</b></label>
          <input type="range" min={0} max={100} step={5} value={form.adherence_diet} onChange={(e) => set("adherence_diet", Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <div>
          <label className="label">Adesão ao treino: <b>{form.adherence_training}%</b></label>
          <input type="range" min={0} max={100} step={5} value={form.adherence_training} onChange={(e) => set("adherence_training", Number(e.target.value))} className="w-full accent-tech-600" />
        </div>
        <Range label="Energia" value={form.energy_level} onChange={(v) => set("energy_level", v)} />
        <Range label="Qualidade do sono" value={form.sleep_quality} onChange={(v) => set("sleep_quality", v)} />
        <Range label="Estresse" value={form.stress_level} onChange={(v) => set("stress_level", v)} />
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <label className="label">Dificuldades do mês</label>
          <textarea className="input min-h-16" placeholder="O que atrapalhou? (rotina, fome, motivação...)" value={form.difficulties} onChange={(e) => set("difficulties", e.target.value)} />
        </div>
        <div>
          <label className="label">Sintomas</label>
          <input className="input" value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input min-h-16" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button onClick={save} disabled={saving} className="btn-gradient w-full py-4">
        {saving ? "Salvando e reanalisando..." : "Enviar check-in mensal e atualizar plano"}
      </button>
      <p className="text-center text-xs text-ink-mute">
        Após o envio, a equipe de IA compara seus dados anteriores e atuais e sugere ajustes no plano.
      </p>
    </div>
  );
}
