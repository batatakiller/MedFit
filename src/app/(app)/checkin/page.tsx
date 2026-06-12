import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { QuickCheckinForm } from "@/components/checkins/QuickCheckinForm";

export const metadata = { title: "Check-in rápido" };
export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: meds } = await supabase
    .from("medications")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Check-in rápido ✅" subtitle="30 segundos para registrar como foi seu dia." />
      <QuickCheckinForm hasMedications={(meds ?? []).length > 0} />
    </div>
  );
}
