import { PageHeader } from "@/components/ui";
import { MonthlyCheckinForm } from "@/components/checkins/MonthlyCheckinForm";
import { requireAuth } from "@/lib/auth";

export const metadata = { title: "Check-in mensal" };
export const dynamic = "force-dynamic";

export default async function CheckinMensalPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-lg lg:max-w-2xl">
      <PageHeader
        title="Check-in mensal 📅"
        subtitle="Atualize peso, medidas e adesão — a IA compara com o mês anterior e ajusta a estratégia."
      />
      <MonthlyCheckinForm />
    </div>
  );
}
