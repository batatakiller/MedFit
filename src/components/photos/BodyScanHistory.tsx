// BodyScanHistory — lista de sessões de scan com estimativas
import Link from "next/link";
import { Camera } from "lucide-react";
import { Card, ConfidenceScoreBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export interface ScanSessionRow {
  id: string;
  scan_date: string;
  status: string;
  confidence_score: number | null;
  body_fat_estimate: number | null;
  margin_of_error: string | null;
  weight_at_scan: number | null;
  measurements?: {
    waist_estimate: number | null;
    hip_estimate: number | null;
    chest_estimate: number | null;
    arm_estimate: number | null;
    thigh_estimate: number | null;
  } | null;
}

export function BodyScanHistory({ sessions }: { sessions: ScanSessionRow[] }) {
  if (!sessions.length) {
    return (
      <Card className="text-center">
        <Camera className="mx-auto h-8 w-8 text-ink-mute" />
        <p className="mt-2 font-semibold">Nenhum body scan ainda</p>
        <p className="mt-1 text-sm text-ink-soft">Envie suas primeiras fotos para criar o histórico visual de evolução.</p>
        <Link href="/fotos" className="btn-primary mt-4 inline-flex">Enviar fotos</Link>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{formatDate(s.scan_date)}</p>
              <p className="text-sm text-ink-soft dark:text-slate-400">
                {s.status === "concluido"
                  ? <>Gordura estimada: <b>{s.body_fat_estimate ?? "—"}%</b>{s.weight_at_scan ? ` · ${s.weight_at_scan}kg` : ""}</>
                  : "Rejeitado — qualidade de foto insuficiente"}
              </p>
            </div>
            <ConfidenceScoreBadge score={s.confidence_score} marginOfError={s.margin_of_error} />
          </div>
          {s.measurements && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                ["Cintura", s.measurements.waist_estimate],
                ["Quadril", s.measurements.hip_estimate],
                ["Tórax", s.measurements.chest_estimate],
                ["Braço", s.measurements.arm_estimate],
                ["Coxa", s.measurements.thigh_estimate],
              ].map(([label, v]) =>
                v != null ? (
                  <span key={label as string} className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {label}: {v}cm
                  </span>
                ) : null
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
