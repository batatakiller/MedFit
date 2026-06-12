"use client";

// MedicationList + MedicationScheduleCard + MedicationReminderCard
// Apenas REGISTRO e LEMBRETE de medicamentos cadastrados pelo paciente.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Pill, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface TodayMedication {
  scheduleId: string;
  medicationId: string;
  time: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  status: "pendente" | "tomado" | "pulado";
}

const statusMeta = {
  pendente: { label: "Pendente", cls: "bg-slate-100 text-slate-600" },
  tomado: { label: "Tomado", cls: "bg-brand-100 text-brand-800" },
  pulado: { label: "Pulado", cls: "bg-amber-100 text-amber-800" },
} as const;

export function MedicationReminderCard({ med }: { med: TodayMedication }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "tomado" | "pulado") {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("medication_logs").insert({
        user_id: user.id,
        medication_id: med.medicationId,
        scheduled_time: `${new Date().toISOString().slice(0, 10)}T${med.time}:00`,
        status,
        taken_at: status === "tomado" ? new Date().toISOString() : null,
      });
    }
    setBusy(false);
    router.refresh();
  }

  const meta = statusMeta[med.status];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tech-50 dark:bg-tech-950/50">
            <Pill className="h-5 w-5 text-tech-600" />
          </span>
          <div>
            <p className="font-bold">{med.name}</p>
            <p className="text-sm text-ink-soft dark:text-slate-400">
              {med.dosage && <>{med.dosage} · </>}
              {med.frequency && <>{med.frequency} · </>}
              <span className="inline-flex items-center gap-1 font-semibold text-tech-700">
                <Clock className="h-3.5 w-3.5" /> {med.time}
              </span>
            </p>
            {med.notes && <p className="mt-0.5 text-xs text-ink-mute">{med.notes}</p>}
          </div>
        </div>
        <span className={`chip shrink-0 ${meta.cls}`}>{meta.label}</span>
      </div>
      {med.status === "pendente" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setStatus("tomado")} disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-95">
            <Check className="h-4 w-4" /> Tomei
          </button>
          <button onClick={() => setStatus("pulado")} disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-slate-50 active:scale-95 dark:border-slate-700">
            <SkipForward className="h-4 w-4" /> Pulei
          </button>
        </div>
      )}
    </div>
  );
}

export function MedicationScheduleCard({ meds }: { meds: TodayMedication[] }) {
  if (!meds.length) {
    return (
      <p className="text-sm text-ink-soft">
        Nenhum medicamento cadastrado para hoje. Cadastre em “Medicações” apenas o que você já usa
        por orientação médica.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {meds.map((m) => (
        <MedicationReminderCard key={`${m.scheduleId}-${m.time}`} med={m} />
      ))}
    </div>
  );
}

// Lista completa (página Medicações) — cadastro/gestão
export function MedicationList({
  medications,
}: {
  medications: { id: string; name: string; dosage: string | null; frequency: string | null; reason: string | null; notes: string | null; times: string[] }[];
}) {
  const router = useRouter();

  async function deactivate(id: string) {
    const supabase = createClient();
    await supabase.from("medications").update({ active: false }).eq("id", id);
    await supabase.from("medication_schedules").update({ active: false }).eq("medication_id", id);
    router.refresh();
  }

  if (!medications.length) {
    return <p className="text-sm text-ink-soft">Nenhum medicamento cadastrado.</p>;
  }

  return (
    <div className="space-y-3">
      {medications.map((m) => (
        <div key={m.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{m.name}</p>
              <p className="text-sm text-ink-soft dark:text-slate-400">
                {[m.dosage, m.frequency, m.reason].filter(Boolean).join(" · ") || "Sem detalhes"}
              </p>
              {m.times.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {m.times.map((t) => (
                    <span key={t} className="chip bg-tech-50 text-tech-700">
                      <Clock className="h-3 w-3" /> {t}
                    </span>
                  ))}
                </p>
              )}
              {m.notes && <p className="mt-1 text-xs text-ink-mute">{m.notes}</p>}
            </div>
            <button onClick={() => deactivate(m.id)}
              className="shrink-0 text-xs font-semibold text-rose-500 hover:underline">
              Remover
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
