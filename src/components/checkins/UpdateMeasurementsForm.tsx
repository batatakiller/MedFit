"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FIELDS: [string, string][] = [
  ["weight", "Peso (kg)"], ["waist", "Cintura (cm)"], ["hip", "Quadril (cm)"],
  ["chest", "Peitoral (cm)"], ["abdomen", "Abdômen (cm)"], ["arm", "Braço (cm)"],
  ["thigh", "Coxa (cm)"], ["neck", "Pescoço (cm)"], ["shoulder", "Ombros (cm)"],
];

export function UpdateMeasurementsForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!values.weight) {
      setError("Informe pelo menos o peso.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const num = (k: string) => (values[k] ? Number(values[k]) : null);
    const { error: err } = await supabase.from("body_measurements").insert({
      user_id: user.id,
      weight: num("weight"), waist: num("waist"), hip: num("hip"),
      chest: num("chest"), abdomen: num("abdomen"), arm: num("arm"),
      thigh: num("thigh"), neck: num("neck"), shoulder: num("shoulder"),
    });
    setSaving(false);
    if (err) {
      setError("Não foi possível salvar.");
      return;
    }
    setOpen(false);
    setValues({});
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        <Ruler className="h-4 w-4" /> Atualizar medidas / registrar peso
      </button>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <p className="font-bold">Novas medidas</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <label className="label text-xs">{label}</label>
            <input type="number" step="0.1" className="input py-2"
              value={values[k] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "Salvando..." : "Salvar medidas"}</button>
        <button onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
      </div>
    </div>
  );
}
