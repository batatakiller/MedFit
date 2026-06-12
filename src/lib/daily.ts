import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayISO } from "@/lib/utils";
import type { WorkoutDay } from "@/lib/ai/types";

// Garante que as tarefas de HOJE existem (geradas a partir do plano ativo).
// Idempotente: só cria quando não há tarefas para a data.
export async function ensureDailyTasks(sb: SupabaseClient, userId: string) {
  const date = todayISO();

  const [{ data: meals }, { data: workouts }] = await Promise.all([
    sb.from("daily_meal_tasks").select("id").eq("user_id", userId).eq("date", date).limit(1),
    sb.from("daily_workout_tasks").select("id").eq("user_id", userId).eq("date", date).limit(1),
  ]);

  if (!meals?.length) {
    const { data: plan } = await sb
      .from("meal_plans").select("*").eq("user_id", userId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (plan) {
      const items = [
        ["cafe", "Café da manhã", plan.breakfast],
        ["almoco", "Almoço", plan.lunch],
        ["jantar", "Jantar", plan.dinner],
        ["lanche", "Lanches", plan.snacks],
      ] as const;
      await sb.from("daily_meal_tasks").insert(
        items.map(([meal_type, title, content]) => ({
          user_id: userId, date, meal_type, title,
          description: Array.isArray(content) ? (content as string[]).join(" · ") : String(content ?? ""),
        }))
      );
    }
  }

  if (!workouts?.length) {
    const { data: plan } = await sb
      .from("workout_plans").select("*").eq("user_id", userId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (plan) {
      const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
      const today = dayKeys[new Date().getDay()];
      const days = (plan.workout_days ?? []) as WorkoutDay[];
      const workout = days.find((d) => d.day === today);
      if (workout) {
        const { data: task } = await sb
          .from("daily_workout_tasks")
          .insert({
            user_id: userId, date, workout_plan_id: plan.id,
            title: workout.name,
            description: `${workout.goal} — ${workout.duration}. Aquecimento: ${workout.warmup}`,
          })
          .select("id")
          .single();
        if (task && workout.exercises?.length) {
          await sb.from("exercise_logs").insert(
            workout.exercises.map((ex) => ({
              user_id: userId, daily_workout_task_id: task.id,
              exercise_name: ex.name, sets: ex.sets, reps: ex.reps,
              rest_seconds: ex.rest, load: ex.load ?? null,
            }))
          );
        }
      }
    }
  }
}

// Medicações de hoje: agenda + status dos logs do dia
export async function getTodayMedications(sb: SupabaseClient, userId: string) {
  const dow = new Date().getDay();
  const start = `${todayISO()}T00:00:00`;
  const [{ data: schedules }, { data: logs }] = await Promise.all([
    sb.from("medication_schedules")
      .select("id, scheduled_time, days_of_week, medication_id, medications(name, dosage, frequency, notes)")
      .eq("user_id", userId).eq("active", true).order("scheduled_time"),
    sb.from("medication_logs").select("*").eq("user_id", userId).gte("created_at", start),
  ]);
  return (schedules ?? [])
    .filter((s) => (s.days_of_week ?? []).includes(dow))
    .map((s) => {
      const med = s.medications as unknown as { name: string; dosage: string | null; frequency: string | null; notes: string | null } | null;
      const log = (logs ?? []).find(
        (l) => l.medication_id === s.medication_id &&
          String(l.scheduled_time ?? "").includes(String(s.scheduled_time).slice(0, 5))
      );
      return {
        scheduleId: s.id as string,
        medicationId: s.medication_id as string,
        time: String(s.scheduled_time).slice(0, 5),
        name: med?.name ?? "Medicamento",
        dosage: med?.dosage ?? null,
        frequency: med?.frequency ?? null,
        notes: med?.notes ?? null,
        status: (log?.status ?? "pendente") as "pendente" | "tomado" | "pulado",
      };
    });
}
