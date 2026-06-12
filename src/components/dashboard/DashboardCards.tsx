// DashboardCards + AlertsCard + TimelineProgress + AdherenceTracker + DailyTaskCard
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Circle, Target } from "lucide-react";
import { Card, ProgressBar, StatCard } from "@/components/ui";
import { imcCategory } from "@/lib/calculations";
import { GOAL_LABELS } from "@/lib/validators";
import { formatDate } from "@/lib/utils";

export function DashboardCards({
  imc, weight, targetWeight, goalType, monthDelta, nextCheckin,
}: {
  imc: number | null; weight: number | null; targetWeight: number | null;
  goalType: string | null; monthDelta: number | null; nextCheckin: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard label="IMC" value={imc ?? "—"} hint={imcCategory(imc)} accent="tech" />
      <StatCard label="Peso atual" value={weight ? `${weight}kg` : "—"} accent="brand" />
      <StatCard label="Peso desejado" value={targetWeight ? `${targetWeight}kg` : "—"} hint={weight && targetWeight ? `${Math.abs(weight - targetWeight).toFixed(1)}kg a ${weight > targetWeight ? "perder" : "ganhar"}` : undefined} accent="brand" />
      <StatCard label="Evolução do mês" value={monthDelta != null ? `${monthDelta > 0 ? "+" : ""}${monthDelta.toFixed(1)}kg` : "—"} accent={monthDelta != null && monthDelta < 0 ? "brand" : "amber"} />
      <StatCard label="Objetivo" value={<span className="text-base">{GOAL_LABELS[goalType ?? ""] ?? "Defina"}</span>} hint={nextCheckin ? `Próx. avaliação: ${formatDate(nextCheckin)}` : undefined} accent="tech" />
    </div>
  );
}

export function AlertsCard({ alerts }: { alerts: string[] }) {
  if (!alerts.length) return null;
  return (
    <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30">
      <h3 className="font-bold text-amber-900 dark:text-amber-200">⚠️ Alertas de saúde</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
        {alerts.map((a, i) => <li key={i}>• {a}</li>)}
      </ul>
    </Card>
  );
}

// TimelineProgress — linha do tempo de marcos do paciente
export function TimelineProgress({
  events,
}: {
  events: { date: string; title: string; description?: string }[];
}) {
  if (!events.length) return null;
  return (
    <Card>
      <h3 className="flex items-center gap-2 font-bold"><CalendarCheck className="h-5 w-5 text-brand-600" /> Linha do tempo</h3>
      <ol className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-brand-gradient" />
            <p className="text-xs font-semibold text-ink-mute">{formatDate(e.date)}</p>
            <p className="font-semibold">{e.title}</p>
            {e.description && <p className="text-sm text-ink-soft dark:text-slate-400">{e.description}</p>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

// AdherenceTracker — adesão do dia/semana
export function AdherenceTracker({
  workoutPct, dietPct, waterPct,
}: {
  workoutPct: number; dietPct: number; waterPct: number;
}) {
  const rows = [
    ["Treino", workoutPct, "bg-tech-600"],
    ["Dieta", dietPct, "bg-brand-600"],
    ["Água", waterPct, "bg-sky-500"],
  ] as const;
  return (
    <Card>
      <h3 className="flex items-center gap-2 font-bold"><Target className="h-5 w-5 text-brand-600" /> Adesão ao plano</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, pct]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="font-bold">{Math.round(pct)}%</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// DailyTaskCard — tarefa diária com check
export function DailyTaskCard({
  title, description, completed, href,
}: {
  title: string; description?: string | null; completed: boolean; href?: string;
}) {
  const inner = (
    <div className={`flex items-start gap-3 rounded-xl border p-4 transition ${completed ? "border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/20" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"}`}>
      {completed
        ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
      <div>
        <p className={`font-semibold ${completed ? "text-brand-800 line-through dark:text-brand-300" : ""}`}>{title}</p>
        {description && <p className="text-sm text-ink-soft dark:text-slate-400">{description}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
