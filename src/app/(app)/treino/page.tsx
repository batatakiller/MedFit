import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureDailyTasks } from "@/lib/daily";
import { todayISO } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/ui";
import { DailyWorkoutCard } from "@/components/training/DailyWorkoutCard";

export const metadata = { title: "Treino do dia" };
export const dynamic = "force-dynamic";

export default async function TreinoPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  await ensureDailyTasks(supabase, user.id);

  const { data: task } = await supabase
    .from("daily_workout_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayISO())
    .limit(1)
    .maybeSingle();

  const { data: exercises } = task
    ? await supabase
        .from("exercise_logs")
        .select("*")
        .eq("daily_workout_task_id", task.id)
        .order("created_at")
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader
        title="Treino do dia 🏋️"
        subtitle={task ? undefined : "Hoje não há treino programado no seu plano."}
        action={<Link href="/plano-treino" className="text-sm font-semibold text-tech-600 hover:underline">Plano semanal →</Link>}
      />
      {task ? (
        <DailyWorkoutCard task={task} exercises={exercises ?? []} />
      ) : (
        <EmptyState
          title="Dia de descanso (ou plano ainda não gerado)"
          description="Descanso também faz parte da evolução. Se você ainda não tem plano, gere sua análise multiagente no dashboard."
          action={<Link href="/dashboard" className="btn-primary">Ir para o dashboard</Link>}
        />
      )}
    </div>
  );
}
