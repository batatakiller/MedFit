import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { MealPlanCard } from "@/components/diet/MealPlanCard";

export const metadata = { title: "Plano alimentar" };
export const dynamic = "force-dynamic";

export default async function PlanoAlimentarPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-4xl">
      <PageHeader title="Plano alimentar 🥦" subtitle="Estratégia criada pelo nutricionista virtual e validada pelo supervisor." />
      {plan ? (
        <MealPlanCard plan={plan} />
      ) : (
        <EmptyState
          title="Sem plano alimentar ativo"
          description="Gere sua análise multiagente para criar o plano."
          action={<Link href="/dashboard" className="btn-primary">Ir para o dashboard</Link>}
        />
      )}
    </div>
  );
}
