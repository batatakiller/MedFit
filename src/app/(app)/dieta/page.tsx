import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureDailyTasks } from "@/lib/daily";
import { calcWaterGoalMl } from "@/lib/calculations";
import { todayISO } from "@/lib/utils";
import { PageHeader, SafetyWarningCard } from "@/components/ui";
import { MealChecklist } from "@/components/diet/MealChecklist";
import { WaterTracker } from "@/components/diet/WaterTracker";

export const metadata = { title: "Dieta do dia" };
export const dynamic = "force-dynamic";

export default async function DietaPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  await ensureDailyTasks(supabase, user.id);

  const date = todayISO();
  const [mealsQ, waterQ, planQ, healthQ] = await Promise.all([
    supabase.from("daily_meal_tasks").select("*").eq("user_id", user.id).eq("date", date).order("created_at"),
    supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", date),
    supabase.from("meal_plans").select("water_goal_ml, calories_estimate, protein, carbs, fats, notes").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("health_records").select("weight").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const consumed = (waterQ.data ?? []).reduce((a, w) => a + w.amount_ml, 0);
  const goal = planQ.data?.water_goal_ml ?? calcWaterGoalMl(healthQ.data?.weight ? Number(healthQ.data.weight) : null);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader
        title="Dieta do dia 🥗"
        subtitle={
          planQ.data?.calories_estimate
            ? `~${planQ.data.calories_estimate} kcal · P ${planQ.data.protein}g · C ${planQ.data.carbs}g · G ${planQ.data.fats}g (estimativa)`
            : undefined
        }
        action={<Link href="/plano-alimentar" className="text-sm font-semibold text-brand-600 hover:underline">Plano completo →</Link>}
      />

      <MealChecklist tasks={mealsQ.data ?? []} />

      <WaterTracker consumedMl={consumed} goalMl={goal} />

      <SafetyWarningCard
        title="Orientação alimentar"
        warnings={[
          "Este plano alimentar é uma orientação educacional. Em casos clínicos (diabetes, hipertensão, gestação, alergias graves), valide com nutricionista presencial.",
        ]}
      />
    </div>
  );
}
