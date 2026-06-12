import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureDailyTasks, getTodayMedications } from "@/lib/daily";
import { calcWaterGoalMl } from "@/lib/calculations";
import { GOAL_LABELS } from "@/lib/validators";
import { greeting, todayISO } from "@/lib/utils";
import { Card, EducationalNotice, ProgressBar } from "@/components/ui";
import { WaterTracker } from "@/components/diet/WaterTracker";
import { DailyTaskCard } from "@/components/dashboard/DashboardCards";
import { MedicationScheduleCard } from "@/components/meds/MedicationList";
import { UnreadNotificationsCard } from "@/components/dashboard/NotificationsList";
import { ClipboardCheck, Scale } from "lucide-react";

export const metadata = { title: "Hoje" };
export const dynamic = "force-dynamic";

// MobileTodayDashboard — página “Hoje”
export default async function HojePage() {
  const user = await requireAuth();
  const supabase = await createClient();
  await ensureDailyTasks(supabase, user.id);

  const date = todayISO();
  const [profileQ, goalQ, healthQ, mealsQ, workoutQ, waterQ, checkinQ, assessQ, notifQ] = await Promise.all([
    supabase.from("profiles").select("name").eq("user_id", user.id).single(),
    supabase.from("goals").select("goal_type").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("health_records").select("weight").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("daily_meal_tasks").select("*").eq("user_id", user.id).eq("date", date).order("created_at"),
    supabase.from("daily_workout_tasks").select("*").eq("user_id", user.id).eq("date", date).limit(1).maybeSingle(),
    supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", date),
    supabase.from("daily_checkins").select("id").eq("user_id", user.id).eq("date", date).maybeSingle(),
    supabase.from("ai_assessments").select("daily_mobile_plan, risk_alerts").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "lida"),
  ]);

  const meds = await getTodayMedications(supabase, user.id);
  const meals = mealsQ.data ?? [];
  const workout = workoutQ.data;
  const consumed = (waterQ.data ?? []).reduce((acc, w) => acc + w.amount_ml, 0);
  const waterGoal =
    (assessQ.data?.daily_mobile_plan as { water_goal_ml?: number } | null)?.water_goal_ml ??
    calcWaterGoalMl(healthQ.data?.weight ? Number(healthQ.data.weight) : null);

  const nextMeal = meals.find((m) => !m.completed);
  const nextMed = meds.find((m) => m.status === "pendente");
  const tasksTotal = meals.length + (workout ? 1 : 0) + (meds.length ? 1 : 0) + 1; // +1 água
  const tasksDone =
    meals.filter((m) => m.completed).length +
    (workout?.completed ? 1 : 0) +
    (meds.length && meds.every((m) => m.status !== "pendente") ? 1 : 0) +
    (consumed >= waterGoal ? 1 : 0);
  const progress = tasksTotal ? (tasksDone / tasksTotal) * 100 : 0;

  const firstName = profileQ.data?.name?.split(" ")[0] ?? "atleta";
  const alerts = (assessQ.data?.risk_alerts as string[] | null) ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      {/* Saudação + objetivo + progresso do dia */}
      <Card className="bg-brand-gradient text-white border-0">
        <p className="text-sm/relaxed opacity-90">{greeting()},</p>
        <h1 className="text-2xl font-extrabold">{firstName}! 💪</h1>
        <p className="mt-1 text-sm opacity-90">
          Objetivo: <b>{GOAL_LABELS[goalQ.data?.goal_type ?? ""] ?? "definir objetivo"}</b>
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span>Progresso de hoje</span>
            <span>{tasksDone}/{tasksTotal} concluídos</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      <UnreadNotificationsCard count={notifQ.count ?? 0} />

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ {alerts[0]}
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/checkin" className="card flex items-center gap-2 p-4 font-bold text-brand-700 transition active:scale-95">
          <ClipboardCheck className="h-5 w-5" /> Check-in rápido
        </Link>
        <Link href="/evolucao" className="card flex items-center gap-2 p-4 font-bold text-tech-700 transition active:scale-95">
          <Scale className="h-5 w-5" /> Registrar peso
        </Link>
      </div>

      {/* Próximos passos */}
      <section className="space-y-2.5">
        <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-ink-mute">Checklist do dia</h2>
        {workout && (
          <DailyTaskCard
            title={`Treino: ${workout.title}`}
            description={workout.description}
            completed={workout.completed}
            href="/treino"
          />
        )}
        {nextMeal ? (
          <DailyTaskCard
            title={`Próxima refeição: ${nextMeal.title}`}
            description={nextMeal.description}
            completed={false}
            href="/dieta"
          />
        ) : meals.length > 0 ? (
          <DailyTaskCard title="Todas as refeições concluídas 🎉" completed href="/dieta" />
        ) : null}
        {nextMed && (
          <DailyTaskCard
            title={`Próximo medicamento cadastrado: ${nextMed.name}`}
            description={`Horário informado: ${nextMed.time}${nextMed.dosage ? ` · ${nextMed.dosage}` : ""}`}
            completed={false}
            href="/medicacoes"
          />
        )}
        <DailyTaskCard
          title={checkinQ.data ? "Check-in de hoje feito ✓" : "Fazer check-in rápido"}
          description="Energia, dieta, treino, sono e sintomas"
          completed={Boolean(checkinQ.data)}
          href="/checkin"
        />
      </section>

      {/* Água */}
      <WaterTracker consumedMl={consumed} goalMl={waterGoal} />

      {/* Medicações de hoje */}
      {meds.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-ink-mute">
            Medicamentos cadastrados — hoje
          </h2>
          <MedicationScheduleCard meds={meds} />
        </section>
      )}

      <EducationalNotice className="px-1" />
    </div>
  );
}
