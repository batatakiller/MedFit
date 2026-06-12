import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { VisualProgressComparison, type ScanWithPhotos } from "@/components/photos/VisualProgressComparison";

export const metadata = { title: "Comparativo visual" };
export const dynamic = "force-dynamic";

export default async function ComparativoPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("body_scan_sessions")
    .select("id, scan_date, body_fat_estimate, weight_at_scan, body_scan_photos(angle, file_url)")
    .eq("user_id", user.id)
    .eq("status", "concluido")
    .order("scan_date", { ascending: false })
    .limit(12);

  const scans: ScanWithPhotos[] = (data ?? []).map((s) => ({
    id: s.id,
    scan_date: s.scan_date,
    body_fat_estimate: s.body_fat_estimate ? Number(s.body_fat_estimate) : null,
    weight_at_scan: s.weight_at_scan ? Number(s.weight_at_scan) : null,
    photos: (s.body_scan_photos as { angle: string; file_url: string }[]) ?? [],
  }));

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader title="Comparativo visual de evolução" subtitle="Antes e depois, lado a lado, por ângulo." />
      <VisualProgressComparison scans={scans} />
    </div>
  );
}
