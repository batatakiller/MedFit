import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { BodyScanHistory, type ScanSessionRow } from "@/components/photos/BodyScanHistory";

export const metadata = { title: "Histórico de body scans" };
export const dynamic = "force-dynamic";

export default async function ScansPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("body_scan_sessions")
    .select("*, body_scan_measurements(waist_estimate, hip_estimate, chest_estimate, arm_estimate, thigh_estimate)")
    .eq("user_id", user.id)
    .order("scan_date", { ascending: false })
    .limit(24);

  const sessions: ScanSessionRow[] = (data ?? []).map((s) => ({
    id: s.id,
    scan_date: s.scan_date,
    status: s.status,
    confidence_score: s.confidence_score ? Number(s.confidence_score) : null,
    body_fat_estimate: s.body_fat_estimate ? Number(s.body_fat_estimate) : null,
    margin_of_error: s.margin_of_error,
    weight_at_scan: s.weight_at_scan ? Number(s.weight_at_scan) : null,
    measurements: Array.isArray(s.body_scan_measurements) ? s.body_scan_measurements[0] ?? null : null,
  }));

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader
        title="Histórico de body scans"
        subtitle="Estimativas por imagem com confiança e margem de erro declaradas."
        action={<Link href="/fotos" className="btn-primary px-4 py-2 text-sm">Novo scan</Link>}
      />
      <BodyScanHistory sessions={sessions} />
    </div>
  );
}
