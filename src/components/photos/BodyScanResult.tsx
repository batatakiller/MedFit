"use client";

import Link from "next/link";
import { Ruler } from "lucide-react";
import { ConfidenceScoreBadge } from "@/components/ui";

interface ScanApiResult {
  ok: boolean;
  scanId: string;
  status: string;
  estimates: {
    shoulderWidthCm: number | null; waistCm: number | null; hipCm: number | null;
    chestCm: number | null; neckCm: number | null; armCm: number | null; thighCm: number | null;
    bodyFatPct: number | null; postureNotes: string[]; confidence: number; marginOfError: string;
  } | null;
}

const rows: [keyof NonNullable<ScanApiResult["estimates"]>, string][] = [
  ["waistCm", "Cintura"], ["hipCm", "Quadril"], ["chestCm", "Tórax"],
  ["shoulderWidthCm", "Largura de ombros"], ["armCm", "Braço"], ["thighCm", "Coxa"], ["neckCm", "Pescoço"],
];

export function BodyScanResult({ result, onNew }: { result: ScanApiResult; onNew: () => void }) {
  if (!result.ok || !result.estimates) {
    return (
      <div className="card p-5 text-center">
        <p className="text-3xl">📷</p>
        <p className="mt-2 font-bold">Fotos com qualidade insuficiente</p>
        <p className="mt-1 text-sm text-ink-soft">
          Não foi possível detectar o corpo com confiança. Revise o guia (corpo inteiro, boa luz,
          fundo neutro) e envie novamente.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={onNew} className="btn-primary">Tentar novamente</button>
          <Link href="/guia-fotos" className="btn-secondary">Ver guia</Link>
        </div>
      </div>
    );
  }

  const e = result.estimates;
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold"><Ruler className="h-5 w-5 text-purple-600" /> Resultado do scan (estimativas)</h3>
        <ConfidenceScoreBadge score={e.confidence} marginOfError={e.marginOfError} />
      </div>

      {e.bodyFatPct != null && (
        <div className="rounded-xl bg-purple-50 p-4 text-center dark:bg-purple-950/30">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Gordura corporal estimada</p>
          <p className="text-3xl font-extrabold text-purple-800 dark:text-purple-300">{e.bodyFatPct}%</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map(([k, label]) => {
          const v = e[k];
          return v != null && typeof v === "number" ? (
            <div key={k} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <p className="text-xs font-semibold text-ink-mute">{label}</p>
              <p className="text-lg font-extrabold">{v}cm</p>
            </div>
          ) : null;
        })}
      </div>

      {e.postureNotes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">Postura (estimativa)</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-soft dark:text-slate-300">
            {e.postureNotes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
        </div>
      )}

      <p className="text-xs text-ink-mute">
        Estimativas por imagem — não substituem bioimpedância, adipometria, DEXA ou avaliação
        presencial. Use a tendência mês a mês, não o valor absoluto.
      </p>

      <div className="flex gap-2">
        <Link href="/scans" className="btn-primary flex-1">Ver histórico de scans</Link>
        <button onClick={onNew} className="btn-secondary">Novo scan</button>
      </div>
    </div>
  );
}
