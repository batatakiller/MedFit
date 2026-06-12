import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ConsentForm } from "@/components/consent/ConsentForm";

export const metadata = { title: "Consentimento LGPD" };
export const dynamic = "force-dynamic";

export default async function ConsentimentoPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from("consents")
    .select("consent_type")
    .eq("user_id", user.id)
    .eq("accepted", true);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Consentimento e privacidade"
        subtitle="Antes de cadastrar dados sensíveis, precisamos da sua autorização — LGPD."
      />
      <ConsentForm alreadyAccepted={(data ?? []).map((c) => c.consent_type)} />
    </div>
  );
}
