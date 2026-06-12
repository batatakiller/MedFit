"use client";

// DailyWorkoutCard + ExerciseChecklist + RestTimer — tela "Treino do dia"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Flag, Play, TimerReset } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SafetyWarningCard } from "@/components/ui";
import { SAFETY_STOP_WARNING } from "@/lib/utils";

export interface ExerciseLog {
  id: string;
  exercise_name: string;
  sets: number | null;
  reps: string | null;
  load: string | null;
  rest_seconds: number | null;
  completed: boolean;
  notes: string | null;
}

export interface WorkoutTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  perceived_difficulty: number | null;
  notes: string | null;
}

// RestTimer — cronômetro de descanso entre séries
export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [duration, setDuration] = useState(defaultSeconds);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (interval.current) clearInterval(interval.current); }, []);

  function start(secs: number) {
    if (interval.current) clearInterval(interval.current);
    setDuration(secs);
    setRemaining(secs);
    interval.current = setInterval(() => {
      setRemaining((r) => {
        if (r == null || r <= 1) {
          if (interval.current) clearInterval(interval.current);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(400);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  const mm = remaining != null ? String(Math.floor(remaining / 60)).padStart(1, "0") : "0";
  const ss = remaining != null ? String(remaining % 60).padStart(2, "0") : "00";

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold"><TimerReset className="h-4 w-4 text-tech-600" /> Descanso</p>
        <p className={`mt-1 text-3xl font-extrabold tabular-nums ${remaining === 0 ? "text-brand-600" : "text-ink dark:text-white"}`}>
          {mm}:{ss}
        </p>
        {remaining === 0 && <p className="text-xs font-semibold text-brand-600">Próxima série! 💪</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        {[60, 90, 120].map((s) => (
          <button key={s} onClick={() => start(s)}
            className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${duration === s && remaining != null ? "border-tech-400 bg-tech-50 text-tech-700" : "border-slate-200 text-ink-soft hover:bg-slate-50"}`}>
            {s}s
          </button>
        ))}
      </div>
    </div>
  );
}

// ExerciseChecklist — séries, reps, carga usada e conclusão por exercício
export function ExerciseChecklist({ exercises }: { exercises: ExerciseLog[] }) {
  const router = useRouter();
  const [loads, setLoads] = useState<Record<string, string>>(
    Object.fromEntries(exercises.map((e) => [e.id, e.load ?? ""]))
  );

  async function toggle(ex: ExerciseLog) {
    const supabase = createClient();
    await supabase.from("exercise_logs").update({ completed: !ex.completed }).eq("id", ex.id);
    router.refresh();
  }

  async function saveLoad(ex: ExerciseLog) {
    const supabase = createClient();
    await supabase.from("exercise_logs").update({ load: loads[ex.id] || null }).eq("id", ex.id);
  }

  return (
    <div className="space-y-2.5">
      {exercises.map((ex) => (
        <div key={ex.id} className={`card p-4 ${ex.completed ? "border-brand-200 bg-brand-50/50 dark:bg-brand-950/20" : ""}`}>
          <button onClick={() => toggle(ex)} className="flex w-full items-start gap-3 text-left">
            {ex.completed
              ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
              : <Circle className="mt-0.5 h-6 w-6 shrink-0 text-slate-300" />}
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${ex.completed ? "text-brand-800 line-through dark:text-brand-300" : ""}`}>{ex.exercise_name}</p>
              <p className="text-sm text-ink-soft dark:text-slate-400">
                {ex.sets ?? "?"} séries × {ex.reps ?? "?"}
                {ex.rest_seconds ? ` · descanso ${ex.rest_seconds}s` : ""}
              </p>
            </div>
          </button>
          <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <label className="text-xs font-semibold text-ink-mute">Carga usada:</label>
            <input
              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
              placeholder="ex.: 20kg"
              value={loads[ex.id] ?? ""}
              onChange={(e) => setLoads((s) => ({ ...s, [ex.id]: e.target.value }))}
              onBlur={() => saveLoad(ex)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// DailyWorkoutCard — iniciar/finalizar treino, dificuldade percebida, observações
export function DailyWorkoutCard({ task, exercises }: { task: WorkoutTask; exercises: ExerciseLog[] }) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState(task.perceived_difficulty ?? 5);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [busy, setBusy] = useState(false);

  const started = Boolean(task.started_at);
  const finished = task.completed;
  const doneCount = exercises.filter((e) => e.completed).length;

  async function startWorkout() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("daily_workout_tasks").update({ started_at: new Date().toISOString() }).eq("id", task.id);
    setBusy(false);
    router.refresh();
  }

  async function finishWorkout() {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("daily_workout_tasks")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        perceived_difficulty: difficulty,
        notes: notes || null,
      })
      .eq("id", task.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">{task.title}</h2>
            {task.description && <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">{task.description}</p>}
          </div>
          <span className="chip bg-tech-100 text-tech-800 shrink-0">{doneCount}/{exercises.length} exercícios</span>
        </div>
        <div className="mt-4">
          {!started && !finished && (
            <button onClick={startWorkout} disabled={busy} className="btn-gradient w-full py-4 text-base">
              <Play className="h-5 w-5" /> Iniciar treino
            </button>
          )}
          {started && !finished && (
            <button onClick={finishWorkout} disabled={busy} className="btn-primary w-full py-4 text-base">
              <Flag className="h-5 w-5" /> Finalizar treino
            </button>
          )}
          {finished && (
            <p className="rounded-xl bg-brand-50 p-3 text-center font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              ✅ Treino concluído! Dificuldade registrada: {task.perceived_difficulty ?? difficulty}/10
            </p>
          )}
        </div>
      </div>

      {started && !finished && (
        <>
          <RestTimer defaultSeconds={exercises[0]?.rest_seconds ?? 90} />
          <ExerciseChecklist exercises={exercises} />
          <div className="card space-y-3 p-4">
            <div>
              <label className="label">Dificuldade percebida: <b>{difficulty}/10</b></label>
              <input type="range" min={1} max={10} value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-brand-600" />
            </div>
            <div>
              <label className="label">Observações pós-treino</label>
              <textarea className="input min-h-16" placeholder="Como foi? Alguma dor ou desconforto?"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {!started && !finished && exercises.length > 0 && <ExerciseChecklist exercises={exercises} />}

      <SafetyWarningCard title="Segurança em primeiro lugar" warnings={[SAFETY_STOP_WARNING]} />
    </div>
  );
}
