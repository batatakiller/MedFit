"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MealTask {
  id: string;
  meal_type: string;
  title: string;
  description: string | null;
  completed: boolean;
  off_plan: boolean;
  hunger_level: number | null;
}

const mealEmoji: Record<string, string> = { cafe: "☕", almoco: "🍽️", jantar: "🌙", lanche: "🍎" };

// MealChecklist + DailyDietCard — marca refeições, registra fome e “saí da dieta”
export function MealChecklist({ tasks, compact }: { tasks: MealTask[]; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(task: MealTask) {
    setBusy(task.id);
    const supabase = createClient();
    await supabase
      .from("daily_meal_tasks")
      .update({ completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null })
      .eq("id", task.id);
    setBusy(null);
    router.refresh();
  }

  async function setExtra(task: MealTask, patch: Partial<Pick<MealTask, "off_plan" | "hunger_level">>) {
    const supabase = createClient();
    await supabase.from("daily_meal_tasks").update(patch).eq("id", task.id);
    router.refresh();
  }

  if (!tasks.length) {
    return <p className="text-sm text-ink-soft">Sem refeições planejadas para hoje. Gere uma análise para criar seu plano alimentar.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className={`card p-4 ${t.completed ? "border-brand-200 bg-brand-50/50 dark:bg-brand-950/20" : ""}`}>
          <button onClick={() => toggle(t)} disabled={busy === t.id} className="flex w-full items-start gap-3 text-left">
            {t.completed
              ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
              : <Circle className="mt-0.5 h-6 w-6 shrink-0 text-slate-300" />}
            <div className="min-w-0">
              <p className={`font-bold ${t.completed ? "text-brand-800 dark:text-brand-300" : ""}`}>
                {mealEmoji[t.meal_type] ?? "🍴"} {t.title}
              </p>
              {t.description && <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">{t.description}</p>}
            </div>
          </button>
          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <label className="flex items-center gap-1.5 font-medium text-ink-soft">
                <input type="checkbox" className="h-3.5 w-3.5 accent-amber-500" checked={t.off_plan}
                  onChange={(e) => setExtra(t, { off_plan: e.target.checked })} />
                Saí da dieta nesta refeição
              </label>
              <label className="flex items-center gap-1.5 font-medium text-ink-soft">
                Fome/saciedade:
                <select className="rounded-lg border border-slate-200 px-1.5 py-0.5 dark:bg-slate-900 dark:border-slate-700"
                  value={t.hunger_level ?? ""} onChange={(e) => setExtra(t, { hunger_level: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function DailyDietCard({ tasks }: { tasks: MealTask[] }) {
  const done = tasks.filter((t) => t.completed).length;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold">🍽️ Dieta de hoje</p>
        <span className="chip bg-brand-100 text-brand-800">{done}/{tasks.length || 4}</span>
      </div>
      <div className="mt-3">
        <MealChecklist tasks={tasks} compact />
      </div>
    </div>
  );
}
