"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";

const YesNo = ({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) => (
  <div className="card flex items-center justify-between gap-3 p-4">
    <p className="text-sm font-semibold">{label}</p>
    <div className="flex gap-2">
      {[
        [true, "Sim"],
        [false, "Não"],
      ].map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v as boolean)}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition active:scale-95 ${
            value === v
              ? v
                ? "bg-brand-600 text-white"
                : "bg-rose-500 text-white"
              : "border border-slate-200 text-ink-soft dark:border-slate-700"
          }`}
        >
          {l as string}
        </button>
      ))}
    </div>
  </div>
);

export function QuickCheckinForm({ hasMedications }: { hasMedications: boolean }) {
  const router = useRouter();
  const [energy, setEnergy] = useState(3);
  const [diet, setDiet] = useState<boolean | null>(null);
  const [workout, setWorkout] = useState<boolean | null>(null);
  const [sleep, setSleep] = useState<boolean | null>(null);
  const [meds, setMeds] = useState<boolean | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [pain, setPain] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (diet == null || workout == null || sleep == null) {
      setError("Responda dieta, treino e sono.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        date: todayISO(),
        energy_level: energy,
        diet_completed: diet,
        workout_completed: workout,
        slept_well: sleep,
        sleep_quality: sleep ? 4 : 2,
        medication_completed: hasMedications ? meds : null,
        symptoms: symptoms || null,
        pain: pain || null,
        notes: notes || null,
      },
      { onConflict: "user_id,date" }
    );
    setSaving(false);
    if (err) {
      setError("Não foi possível salvar. Tente novamente.");
      return;
    }
    router.push("/hoje");
    router.refresh();
  }

  const showAlert = Boolean(pain.trim() || symptoms.trim());

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <p className="text-sm font-semibold">Como foi sua energia hoje?</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {["😴", "😕", "🙂", "😃", "🔥"].map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setEnergy(i + 1)}
              className={`rounded-xl py-3 text-2xl transition active:scale-95 ${
                energy === i + 1 ? "bg-brand-100 ring-2 ring-brand-500" : "bg-slate-50 dark:bg-slate-800"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <YesNo label="Você seguiu a dieta?" value={diet} onChange={setDiet} />
      <YesNo label="Você treinou?" value={workout} onChange={setWorkout} />
      <YesNo label="Dormiu bem?" value={sleep} onChange={setSleep} />
      {hasMedications && (
        <YesNo label="Tomou os medicamentos cadastrados?" value={meds} onChange={setMeds} />
      )}

      <div className="card space-y-3 p-4">
        <div>
          <label className="label">Sentiu algum sintoma?</label>
          <input className="input" placeholder="Ex.: tontura, cansaço fora do comum..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        </div>
        <div>
          <label className="label">Teve dor ou desconforto?</label>
          <input className="input" placeholder="Onde e quando?" value={pain} onChange={(e) => setPain(e.target.value)} />
        </div>
        <div>
          <label className="label">Observações livres</label>
          <textarea className="input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {showAlert && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
          Você relatou sintomas/dor. Se houver dor no peito, tontura intensa, falta de ar ou
          mal-estar forte, procure atendimento médico imediatamente. O Med Fit não substitui
          avaliação médica.
        </p>
      )}

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button onClick={save} disabled={saving} className="btn-gradient w-full py-4">
        {saving ? "Salvando..." : "Concluir check-in"}
      </button>
    </div>
  );
}
