import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PatientForm } from "@/components/onboarding/PatientForm";

export const metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // consentimento de dados sensíveis vem antes do onboarding
  const { data: consent } = await supabase
    .from("consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("consent_type", "dados_sensiveis")
    .eq("accepted", true)
    .limit(1)
    .maybeSingle();
  if (!consent) redirect("/consentimento");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Vamos montar seu perfil"
        subtitle="Quanto mais completo, mais precisa fica a análise da sua equipe de IA."
      />
      <PatientForm initialName={profile?.name} />
    </div>
  );
}
