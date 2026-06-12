"use client";

// ExamUpload — upload de exame (PDF/imagem) para bucket privado + OCR básico
// no dispositivo (tesseract.js) para imagens.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractTextFromImage, isOcrSupported } from "@/lib/ocr/extract";

export function ExamUpload({ hasConsent }: { hasConsent: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Arquivo acima de 20MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("sem sessão");

      let extracted = "";
      if (isOcrSupported(file)) {
        setStage("Lendo exame (OCR no seu dispositivo)...");
        extracted = await extractTextFromImage(file, (pct) => setStage(`Lendo exame (OCR)... ${pct}%`)).catch(() => "");
      }

      setStage("Enviando para área privada...");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${user.id}/exam-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("exams").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) throw upErr;

      await supabase.from("exams").insert({
        user_id: user.id,
        file_url: path,
        file_name: file.name,
        file_type: file.type,
        extracted_text: extracted || null,
        notes: notes || null,
      });

      setFile(null);
      setNotes("");
      router.refresh();
    } catch {
      setError("Não foi possível enviar o exame. Tente novamente.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  if (!hasConsent) {
    return (
      <div className="card p-5 text-center">
        <FileText className="mx-auto h-8 w-8 text-ink-mute" />
        <p className="mt-2 font-semibold">Consentimento necessário</p>
        <p className="mt-1 text-sm text-ink-soft">
          Para armazenar exames, aceite o consentimento específico em{" "}
          <a href="/consentimento" className="font-semibold text-brand-600 underline">Consentimento</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-3 p-5">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-8 transition hover:border-brand-400">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <FileText className="h-7 w-7 text-slate-400" />
        <span className="text-sm font-semibold text-ink-soft">
          {file ? file.name : "Selecionar exame (PDF ou imagem)"}
        </span>
        <span className="text-xs text-ink-mute">Imagens passam por OCR no seu dispositivo</span>
      </label>
      <div>
        <label className="label">Observações (opcional)</label>
        <input className="input" placeholder="Ex.: hemograma de junho" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button onClick={submit} disabled={!file || busy} className="btn-primary w-full">
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> {stage || "Enviando..."}</>) : (<><Upload className="h-4 w-4" /> Enviar exame</>)}
      </button>
    </div>
  );
}
