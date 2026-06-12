import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, ConfidenceScoreBadge, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Histórico de avaliações" };
export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: assessments } = await supabase
    .from("ai_assessments")
    .select("id, created_at, confidence_score, risk_alerts, is_mock, integrated_plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader title="Histórico de avaliações" subtitle="Todas as análises geradas pela equipe multidisciplinar de IA." />
      {(assessments ?? []).length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação ainda"
          action={<Link href="/dashboard" className="btn-primary">Gerar primeira análise</Link>}
        />
      ) : (
        (assessments ?? []).map((a, i) => {
          const plan = a.integrated_plan as { summary?: string; next_30_days?: string } | null;
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  Avaliação de {formatDate(a.created_at)}
                  {i === 0 && <span className="chip ml-2 bg-brand-100 text-brand-800">atual</span>}
                  {a.is_mock && <span className="chip ml-2 bg-slate-100 text-slate-600">demo</span>}
                </p>
                <ConfidenceScoreBadge score={a.confidence_score ? Number(a.confidence_score) : null} />
              </div>
              {(plan?.summary || plan?.next_30_days) && (
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft dark:text-slate-400">
                  {plan.summary ?? plan.next_30_days}
                </p>
              )}
              {(a.risk_alerts ?? []).length > 0 && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  ⚠ {(a.risk_alerts as string[]).length} alerta(s) de saúde
                </p>
              )}
              {i === 0 && (
                <Link href="/plano" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
                  Ver plano completo →
                </Link>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
