"use client";

// BodyPhotoUpload — pipeline no cliente:
// 1. seleciona fotos por ângulo → 2. detecta pose (MediaPipe, no dispositivo)
// 3. sobe para bucket privado → 4. POST /api/body-scan (validação + estimativas)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { detectPoseFromFile } from "@/lib/vision/mediapipe";
import type { NormalizedLandmark, ScanAngle } from "@/lib/vision/pipeline";
import { BodyScanResult } from "./BodyScanResult";

const ANGLES: { key: ScanAngle; label: string }[] = [
  { key: "frente", label: "Frente" },
  { key: "lado_esquerdo", label: "Lado esquerdo" },
  { key: "lado_direito", label: "Lado direito" },
  { key: "costas", label: "Costas" },
];

interface PendingPhoto {
  file: File;
  previewUrl: string;
  landmarks: NormalizedLandmark[] | null;
  width: number;
  height: number;
  analyzing: boolean;
}

export function BodyPhotoUpload({ weightKg, hasConsent }: { weightKg: number | null; hasConsent: boolean }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Partial<Record<ScanAngle, PendingPhoto>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function onSelect(angle: ScanAngle, file: File | undefined) {
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPhotos((p) => ({ ...p, [angle]: { file, previewUrl, landmarks: null, width: 0, height: 0, analyzing: true } }));
    const pose = await detectPoseFromFile(file);
    setPhotos((p) => ({
      ...p,
      [angle]: { file, previewUrl, landmarks: pose.landmarks, width: pose.width, height: pose.height, analyzing: false },
    }));
  }

  async function submit() {
    const entries = Object.entries(photos) as [ScanAngle, PendingPhoto][];
    if (!entries.some(([a]) => a === "frente")) {
      setError("A foto de FRENTE é obrigatória para a análise.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("sem sessão");

      setProgress("Enviando fotos para área privada...");
      const uploaded: { angle: ScanAngle; filePath: string; imageWidth: number; imageHeight: number; landmarks: NormalizedLandmark[] | null }[] = [];
      for (const [angle, p] of entries) {
        const ext = p.file.type === "image/png" ? "png" : p.file.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/scan-${Date.now()}-${angle}.${ext}`;
        const { error: upErr } = await supabase.storage.from("body-photos").upload(path, p.file, {
          contentType: p.file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        uploaded.push({ angle, filePath: path, imageWidth: p.width, imageHeight: p.height, landmarks: p.landmarks });
      }

      setProgress("Processando pipeline de análise corporal...");
      const res = await fetch("/api/body-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: uploaded, weightKg }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha");
      setResult(json);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("consentimento")
          ? "É necessário aceitar o consentimento de fotos corporais em Consentimento."
          : "Não foi possível processar as fotos. Verifique o guia e tente novamente."
      );
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  }

  if (!hasConsent) {
    return (
      <div className="card p-5 text-center">
        <Camera className="mx-auto h-8 w-8 text-ink-mute" />
        <p className="mt-2 font-semibold">Consentimento necessário</p>
        <p className="mt-1 text-sm text-ink-soft">
          Para usar a análise corporal por fotos, aceite o consentimento específico em{" "}
          <a href="/consentimento" className="font-semibold text-brand-600 underline">Consentimento</a>.
        </p>
      </div>
    );
  }

  if (result) {
    return <BodyScanResult result={result as Parameters<typeof BodyScanResult>[0]["result"]} onNew={() => setResult(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ANGLES.map(({ key, label }) => {
          const p = photos[key];
          return (
            <label
              key={key}
              className={`relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed transition ${
                p ? "border-brand-400" : "border-slate-300 hover:border-brand-400"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onSelect(key, e.target.files?.[0])}
              />
              {p ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.previewUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 rounded-lg bg-black/60 px-2 py-1 text-center text-xs font-bold text-white">
                    {p.analyzing ? (
                      <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> detectando pose...</span>
                    ) : p.landmarks ? (
                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-brand-400" /> {label} ✓</span>
                    ) : (
                      `${label} (corpo não detectado)`
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6 text-slate-400" />
                  <span className="text-sm font-semibold text-ink-soft">{label}</span>
                  {key === "frente" && <span className="chip bg-brand-100 text-brand-800">obrigatória</span>}
                </>
              )}
            </label>
          );
        })}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || Object.values(photos).some((p) => p?.analyzing)}
        className="btn-gradient w-full py-4"
      >
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> {progress || "Processando..."}</>
        ) : (
          <><Upload className="h-5 w-5" /> Enviar fotos e analisar</>
        )}
      </button>
      <p className="text-center text-xs text-ink-mute">
        A detecção de pose roda no seu dispositivo. As fotos vão para bucket privado com acesso só seu.
      </p>
    </div>
  );
}
