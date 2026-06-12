"use client";

// VisualProgressComparison — comparação lado a lado entre dois scans
import { useState } from "react";
import { SignedImage } from "./SignedImage";
import { formatDate } from "@/lib/utils";

export interface ScanWithPhotos {
  id: string;
  scan_date: string;
  body_fat_estimate: number | null;
  weight_at_scan: number | null;
  photos: { angle: string; file_url: string }[];
}

const angleLabels: Record<string, string> = {
  frente: "Frente", lado_esquerdo: "Lado esq.", lado_direito: "Lado dir.", costas: "Costas",
};

export function VisualProgressComparison({ scans }: { scans: ScanWithPhotos[] }) {
  const [beforeId, setBeforeId] = useState(scans[scans.length - 1]?.id ?? "");
  const [afterId, setAfterId] = useState(scans[0]?.id ?? "");
  const [angle, setAngle] = useState("frente");

  if (scans.length < 2) {
    return (
      <p className="card p-6 text-center text-sm text-ink-soft">
        Você precisa de pelo menos 2 scans com fotos para comparar a evolução visual.
      </p>
    );
  }

  const before = scans.find((s) => s.id === beforeId);
  const after = scans.find((s) => s.id === afterId);
  const photoOf = (s?: ScanWithPhotos) => s?.photos.find((p) => p.angle === angle)?.file_url ?? null;

  const Select = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select className="input py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {scans.map((s) => (
        <option key={s.id} value={s.id}>{formatDate(s.scan_date)}</option>
      ))}
    </select>
  );

  const Pane = ({ scan, title }: { scan?: ScanWithPhotos; title: string }) => {
    const path = photoOf(scan);
    return (
      <div className="space-y-2">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-ink-mute">{title}</p>
        {path ? (
          <SignedImage bucket="body-photos" path={path} alt={title} className="aspect-[3/4] w-full rounded-2xl object-cover" />
        ) : (
          <div className="grid aspect-[3/4] w-full place-items-center rounded-2xl bg-slate-100 text-sm text-ink-mute dark:bg-slate-800">
            sem foto neste ângulo
          </div>
        )}
        {scan && (
          <p className="text-center text-xs text-ink-soft">
            {scan.weight_at_scan ? `${scan.weight_at_scan}kg` : ""}{scan.body_fat_estimate ? ` · ~${scan.body_fat_estimate}% gordura (est.)` : ""}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(angleLabels).map(([k, label]) => (
          <button key={k} onClick={() => setAngle(k)}
            className={`chip border px-3 py-1.5 transition ${angle === k ? "border-purple-400 bg-purple-50 text-purple-800" : "border-slate-200 text-ink-soft"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select value={beforeId} onChange={setBeforeId} />
        <Select value={afterId} onChange={setAfterId} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Pane scan={before} title="Antes" />
        <Pane scan={after} title="Depois" />
      </div>
      <p className="text-xs text-ink-mute">
        Compare sempre fotos com mesma pose, distância e iluminação. Estimativas não substituem
        avaliação presencial.
      </p>
    </div>
  );
}
