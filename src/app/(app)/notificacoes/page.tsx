import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { NotificationsList } from "@/components/dashboard/NotificationsList";

export const metadata = { title: "Notificações" };
export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, status, created_at, read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-2xl">
      <PageHeader title="Notificações 🔔" subtitle="Lembretes e alertas do seu plano." />
      <NotificationsList notifications={data ?? []} />
    </div>
  );
}
