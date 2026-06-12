import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { BodyScanHistory, type ScanSessionRow } from "@/components/photos/BodyScanHistory";
import { Body3DCompareCard } from "@/components/photos/Body3DCompareCard";
import type { BodyMeasures } from "@/components/photos/Body3DViewer";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Histórico de body scans" };
export const dynamic = "force-dynamic";

type MeasurementRow = {
  waist_estimate: string | number | null;
  hip_estimate: string | number | null;
  chest_estimate: string | number | null;
  arm_estimate: string | number | null;
  thigh_estimate: string | number | null;
  neck_estimate: string | number | null;
  shoulder_width_estimate: string | number | null;
} | null;

const toNum = (v: string | number | null | undefined) => (v != null ? Number(v) : null);

function toMeasures(m: MeasurementRow): BodyMeasures | null {
  if (!m) return null;
  return {
    waistCm: toNum(m.waist_estimate),
    hipCm: toNum(m.hip_estimate),
    chestCm: toNum(m.chest_estimate),
    armCm: toNum(m.arm_estimate),
    thighCm: toNum(m.thigh_estimate),
    neckCm: toNum(m.neck_estimate),
    shoulderWidthCm: toNum(m.shoulder_width_estimate),
  };
}

export default async function ScansPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("body_scan_sessions")
    .select(
      "*, body_scan_measurements(waist_estimate, hip_estimate, chest_estimate, arm_estimate, thigh_estimate, neck_estimate, shoulder_width_estimate)"
    )
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

  // dois últimos scans concluídos com medidas → comparação 3D
  const completed = (data ?? []).filter(
    (s) => s.status === "concluido" && Array.isArray(s.body_scan_measurements) && s.body_scan_measurements[0]
  );
  const latest = completed[0] ?? null;
  const prev = completed[1] ?? null;
  const latestMeasures = latest ? toMeasures(latest.body_scan_measurements[0]) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader
        title="Histórico de body scans"
        subtitle="Estimativas por imagem com confiança e margem de erro declaradas."
        action={<Link href="/fotos" className="btn-primary px-4 py-2 text-sm">Novo scan</Link>}
      />
      {latest && latestMeasures && latest.height_reference ? (
        <Body3DCompareCard
          heightCm={Number(latest.height_reference)}
          current={latestMeasures}
          previous={prev ? toMeasures(prev.body_scan_measurements[0]) : null}
          currentDate={formatDate(latest.scan_date)}
          previousDate={prev ? formatDate(prev.scan_date) : null}
        />
      ) : null}
      <BodyScanHistory sessions={sessions} />
    </div>
  );
}
