import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { WorkoutPlanCard } from "@/components/training/WorkoutPlanCard";

export const metadata = { title: "Plano de treino" };
export const dynamic = "force-dynamic";

export default async function PlanoTreinoPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-4xl">
      <PageHeader title="Plano de treino 🏋️" subtitle="Progressivo e adaptado ao seu nível, equipamentos e condições." />
      {plan ? (
        <WorkoutPlanCard plan={plan} />
      ) : (
        <EmptyState
          title="Sem plano de treino ativo"
          description="Gere sua análise multiagente para criar o plano."
          action={<Link href="/dashboard" className="btn-primary">Ir para o dashboard</Link>}
        />
      )}
    </div>
  );
}
