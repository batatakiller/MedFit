// WorkoutPlanCard — plano de treino semanal completo
import { Card, SafetyWarningCard } from "@/components/ui";
import { SAFETY_STOP_WARNING } from "@/lib/utils";
import type { WorkoutDay } from "@/lib/ai/types";

export interface WorkoutPlanRow {
  title: string;
  weekly_frequency: number | null;
  workout_days: unknown;
  progression_strategy: string | null;
  notes: string | null;
}

const dayLabels: Record<string, string> = {
  dom: "Domingo", seg: "Segunda", ter: "Terça", qua: "Quarta",
  qui: "Quinta", sex: "Sexta", sab: "Sábado",
};

export function WorkoutPlanCard({ plan }: { plan: WorkoutPlanRow }) {
  const days = (Array.isArray(plan.workout_days) ? plan.workout_days : []) as WorkoutDay[];
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-bold">{plan.title}</h3>
        <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
          {plan.weekly_frequency ?? days.length}x por semana
        </p>
        {plan.progression_strategy && (
          <p className="mt-2 rounded-xl bg-tech-50 p-3 text-sm text-tech-900 dark:bg-tech-950/40 dark:text-tech-200">
            <b>Progressão:</b> {plan.progression_strategy}
          </p>
        )}
      </Card>

      {days.map((d) => (
        <Card key={`${d.day}-${d.name}`}>
          <div className="flex items-center justify-between">
            <p className="font-bold">{dayLabels[d.day] ?? d.day} — {d.name}</p>
            <span className="chip bg-slate-100 text-slate-600">{d.duration}</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            {d.goal} · Aquecimento: {d.warmup}
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-ink-mute dark:border-slate-800">
                <th className="pb-1.5">Exercício</th>
                <th className="pb-1.5 text-center">Séries</th>
                <th className="pb-1.5 text-center">Reps</th>
                <th className="pb-1.5 text-center">Descanso</th>
              </tr>
            </thead>
            <tbody>
              {d.exercises.map((ex, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                  <td className="py-2 font-medium">{ex.name}</td>
                  <td className="py-2 text-center">{ex.sets}</td>
                  <td className="py-2 text-center">{ex.reps}</td>
                  <td className="py-2 text-center">{ex.rest ? `${ex.rest}s` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      <SafetyWarningCard title="Segurança" warnings={[plan.notes || SAFETY_STOP_WARNING]} />
    </div>
  );
}
