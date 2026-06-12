"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { medicationSchema } from "@/lib/validators";

export function AddMedicationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "", reason: "", notes: "", times: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const times = form.times.split(",").map((t) => t.trim()).filter(Boolean);
    const parsed = medicationSchema.safeParse({ ...form, times });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: med, error: insErr } = await supabase
      .from("medications")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        dosage: parsed.data.dosage || null,
        frequency: parsed.data.frequency || null,
        reason: parsed.data.reason || null,
        notes: parsed.data.notes || null,
      })
      .select("id")
      .single();
    if (insErr || !med) {
      setSaving(false);
      setError("Não foi possível salvar.");
      return;
    }
    if (parsed.data.times.length) {
      await supabase.from("medication_schedules").insert(
        parsed.data.times.map((t) => ({
          user_id: user.id,
          medication_id: med.id,
          scheduled_time: t,
        }))
      );
    }
    setSaving(false);
    setOpen(false);
    setForm({ name: "", dosage: "", frequency: "", reason: "", notes: "", times: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        <Plus className="h-4 w-4" /> Cadastrar medicamento que já uso
      </button>
    );
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="card space-y-3 p-4">
      <p className="font-bold">Novo medicamento (informado por você)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Dosagem</label>
          <input className="input" placeholder="Ex.: 50mg" value={form.dosage} onChange={(e) => set("dosage", e.target.value)} />
        </div>
        <div>
          <label className="label">Frequência</label>
          <input className="input" placeholder="Ex.: 2x ao dia" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} />
        </div>
        <div>
          <label className="label">Horários (HH:MM, separados por vírgula)</label>
          <input className="input" placeholder="08:00, 20:00" value={form.times} onChange={(e) => set("times", e.target.value)} />
        </div>
        <div>
          <label className="label">Motivo (opcional)</label>
          <input className="input" placeholder="Ex.: pressão alta" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
        </div>
        <div>
          <label className="label">Observações</label>
          <input className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "Salvando..." : "Salvar"}</button>
        <button onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
      </div>
    </div>
  );
}
