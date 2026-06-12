import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Assinatura" };
export const dynamic = "force-dynamic";

const plans = [
  {
    key: "gratuito", name: "Gratuito", price: "R$ 0",
    features: ["1 análise multiagente", "Acompanhamento diário (treino, dieta, água)", "Registro de medicamentos e lembretes", "PWA instalável"],
  },
  {
    key: "essencial", name: "Essencial", price: "R$ 39/mês",
    features: ["Análises mensais ilimitadas", "Análise corporal por fotos", "OCR de exames", "Notificações push"],
  },
  {
    key: "performance", name: "Performance", price: "R$ 79/mês",
    features: ["Tudo do Essencial", "Histórico completo de body scans", "Comparativo visual de evolução", "Memória longitudinal (RAG) ampliada"],
  },
];

export default async function AssinaturaPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = sub?.plan ?? "gratuito";

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-4xl">
      <PageHeader
        title="Assinatura 💳"
        subtitle={`Plano atual: ${current} (${sub?.status ?? "ativa"})`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.key === current;
          return (
            <Card key={p.key} className={isCurrent ? "ring-2 ring-brand-500" : ""}>
              {isCurrent && <span className="chip bg-brand-100 text-brand-800">Seu plano</span>}
              <h3 className="mt-1 text-lg font-extrabold">{p.name}</h3>
              <p className="text-2xl font-extrabold">{p.price}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft dark:text-slate-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent}
                className={`mt-4 w-full ${isCurrent ? "btn-secondary opacity-60" : "btn-gradient"}`}
                title={isCurrent ? "Plano atual" : "Integração de pagamento em breve"}
              >
                {isCurrent ? "Plano atual" : "Assinar (em breve)"}
              </button>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-ink-mute">
        A cobrança recorrente (Stripe/Pix) será conectada à tabela <code>subscriptions</code> via
        webhook no backend — a estrutura já está pronta.
      </p>
    </div>
  );
}
