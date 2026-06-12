import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { BodyMeasurementChart, ProgressChart, AdherenceChart } from "@/components/charts/ProgressChart";
import { UpdateMeasurementsForm } from "@/components/checkins/UpdateMeasurementsForm";
import { formatDate } from "@/lib/utils";
import { Camera, GitCompareArrows, CalendarCheck } from "lucide-react";

export const metadata = { title: "Evolução" };
export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [measQ, checkinsQ, scansQ] = await Promise.all([
    supabase.from("body_measurements").select("*").eq("user_id", user.id).order("measurement_date", { ascending: true }).limit(36),
    supabase.from("daily_checkins").select("date, diet_completed, workout_completed").eq("user_id", user.id).order("date", { ascending: false }).limit(28),
    supabase.from("body_scan_sessions").select("scan_date, body_fat_estimate, status").eq("user_id", user.id).eq("status", "concluido").order("scan_date", { ascending: false }).limit(5),
  ]);

  const meas = measQ.data ?? [];
  const latest = meas[meas.length - 1];
  const first = meas[0];

  const weightSeries = meas.map((m) => ({ date: formatDate(m.measurement_date), peso: m.weight ? Number(m.weight) : null }));
  const measureSeries = meas.map((m) => ({
    date: formatDate(m.measurement_date),
    cintura: m.waist ? Number(m.waist) : null,
    abdomen: m.abdomen ? Number(m.abdomen) : null,
    quadril: m.hip ? Number(m.hip) : null,
  }));

  const checkins = checkinsQ.data ?? [];
  const weeks = [3, 2, 1, 0].map((w) => {
    const start = new Date(Date.now() - (w + 1) * 7 * 86400000);
    const end = new Date(Date.now() - w * 7 * 86400000);
    const inWeek = checkins.filter((c) => {
      const d = new Date(c.date);
      return d >= start && d < end;
    });
    const pct = (key: "diet_completed" | "workout_completed") =>
      inWeek.length ? Math.round((inWeek.filter((c) => c[key]).length / 7) * 100) : 0;
    return { label: w === 0 ? "Esta sem." : `-${w} sem.`, treino: pct("workout_completed"), dieta: pct("diet_completed") };
  });

  const delta = (k: "weight" | "waist" | "abdomen") =>
    latest?.[k] != null && first?.[k] != null ? Number(latest[k]) - Number(first[k]) : null;

  const fmt = (v: number | null, unit: string) =>
    v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}${unit}`;

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-4xl">
      <PageHeader title="Evolução 📈" subtitle="Seu progresso desde o início do acompanhamento." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Peso atual" value={latest?.weight ? `${latest.weight}kg` : "—"} accent="brand" />
        <StatCard label="Δ Peso total" value={fmt(delta("weight"), "kg")} accent={delta("weight") != null && delta("weight")! <= 0 ? "brand" : "amber"} />
        <StatCard label="Δ Cintura" value={fmt(delta("waist"), "cm")} accent="tech" />
        <StatCard label="Δ Abdômen" value={fmt(delta("abdomen"), "cm")} accent="tech" />
      </div>

      <UpdateMeasurementsForm />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/fotos" className="card flex items-center gap-2 p-4 text-sm font-bold text-purple-700 transition active:scale-95">
          <Camera className="h-5 w-5" /> Enviar novas fotos
        </Link>
        <Link href="/comparativo" className="card flex items-center gap-2 p-4 text-sm font-bold text-tech-700 transition active:scale-95">
          <GitCompareArrows className="h-5 w-5" /> Comparar evolução
        </Link>
        <Link href="/checkin-mensal" className="card flex items-center gap-2 p-4 text-sm font-bold text-brand-700 transition active:scale-95">
          <CalendarCheck className="h-5 w-5" /> Check-in mensal
        </Link>
      </div>

      <Card>
        <SectionTitle title="Evolução de peso" />
        {weightSeries.filter((w) => w.peso != null).length >= 2
          ? <ProgressChart data={weightSeries} />
          : <p className="text-sm text-ink-soft">Registre o peso ao menos 2 vezes para ver a curva.</p>}
      </Card>

      <Card>
        <SectionTitle title="Evolução de medidas" subtitle="Cintura, abdômen e quadril" />
        {measureSeries.filter((m) => m.cintura != null).length >= 2
          ? <BodyMeasurementChart data={measureSeries} />
          : <p className="text-sm text-ink-soft">Atualize medidas mensalmente para acompanhar aqui.</p>}
      </Card>

      <Card>
        <SectionTitle title="Adesão a treino e dieta" subtitle="Últimas 4 semanas (check-ins diários)" />
        <AdherenceChart data={weeks} />
      </Card>

      {(scansQ.data ?? []).length > 0 && (
        <Card>
          <SectionTitle
            title="Scans corporais recentes"
            action={<Link href="/scans" className="text-sm font-semibold text-brand-600 hover:underline">Ver todos →</Link>}
          />
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {(scansQ.data ?? []).map((s, i) => (
              <li key={i} className="flex justify-between py-2.5">
                <span>{formatDate(s.scan_date)}</span>
                <span className="font-semibold">{s.body_fat_estimate ? `~${s.body_fat_estimate}% gordura (est.)` : "—"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
