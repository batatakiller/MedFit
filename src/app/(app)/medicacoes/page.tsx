import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTodayMedications } from "@/lib/daily";
import { formatDate } from "@/lib/utils";
import { Card, MedicationDisclaimer, PageHeader, SectionTitle } from "@/components/ui";
import { MedicationList, MedicationScheduleCard } from "@/components/meds/MedicationList";
import { AddMedicationForm } from "@/components/meds/AddMedicationForm";

export const metadata = { title: "Medicações" };
export const dynamic = "force-dynamic";

export default async function MedicacoesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [medsQ, schedulesQ, logsQ] = await Promise.all([
    supabase.from("medications").select("*").eq("user_id", user.id).eq("active", true).order("created_at"),
    supabase.from("medication_schedules").select("medication_id, scheduled_time").eq("user_id", user.id).eq("active", true),
    supabase
      .from("medication_logs")
      .select("status, taken_at, created_at, scheduled_time, medications(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const today = await getTodayMedications(supabase, user.id);

  const medications = (medsQ.data ?? []).map((m) => ({
    ...m,
    times: (schedulesQ.data ?? [])
      .filter((s) => s.medication_id === m.id)
      .map((s) => String(s.scheduled_time).slice(0, 5))
      .sort(),
  }));

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <PageHeader title="Medicações 💊" subtitle="Registro e lembretes dos medicamentos que você já usa." />

      <MedicationDisclaimer />

      <section>
        <SectionTitle title="Hoje" subtitle="Confirme conforme os horários que você informou" />
        <MedicationScheduleCard meds={today} />
      </section>

      <AddMedicationForm />

      <section>
        <SectionTitle title="Medicamentos cadastrados" />
        <MedicationList medications={medications} />
      </section>

      <section>
        <SectionTitle title="Histórico de tomada" />
        <Card>
          {(logsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">Sem registros ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {(logsQ.data ?? []).map((l, i) => {
                const med = l.medications as unknown as { name?: string } | null;
                return (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span className="font-medium">{med?.name ?? "Medicamento"}</span>
                    <span className="text-ink-mute">{formatDate(l.created_at)}</span>
                    <span className={`chip ${l.status === "tomado" ? "bg-brand-100 text-brand-800" : l.status === "pulado" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {l.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
