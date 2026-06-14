"use client";

// ExamUpload — upload de exame (PDF/imagem) para bucket privado + OCR básico
// no dispositivo (tesseract.js) para imagens.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractTextFromImage, extractTextFromPdf, isOcrSupported, isPdf } from "@/lib/ocr/extract";

export function ExamUpload({ hasConsent }: { hasConsent: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!files.length) return;
    if (files.length > 10) {
      setError("Envie no máximo 10 arquivos por vez.");
      return;
    }
    if (files.some((file) => file.size > 20 * 1024 * 1024)) {
      setError("Cada arquivo deve ter no máximo 20MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("sem sessão");

      for (const [index, file] of files.entries()) {
        const prefix = `Arquivo ${index + 1}/${files.length}`;
        let extracted = "";
        if (isOcrSupported(file)) {
          setStage(`${prefix}: lendo imagem (OCR)...`);
          extracted = await extractTextFromImage(file, (pct) => setStage(`${prefix}: lendo imagem... ${pct}%`)).catch(() => "");
        } else if (isPdf(file)) {
          setStage(`${prefix}: extraindo texto do PDF...`);
          extracted = await extractTextFromPdf(file, (pct) => setStage(`${prefix}: extraindo PDF... ${pct}%`)).catch(() => "");
        }

        setStage(`${prefix}: enviando para área privada...`);
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${user.id}/exam-${Date.now()}-${index}.${ext}`;
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
      }

      setFiles([]);
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
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <FileText className="h-7 w-7 text-slate-400" />
        <span className="text-sm font-semibold text-ink-soft">
          {files.length
            ? `${files.length} arquivo${files.length > 1 ? "s" : ""} selecionado${files.length > 1 ? "s" : ""}`
            : "Selecionar exames (PDF ou imagem)"}
        </span>
        <span className="text-xs text-ink-mute">Até 10 arquivos por envio. Imagens passam por OCR e PDFs têm o texto extraído no seu dispositivo</span>
      </label>
      {files.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-ink-soft dark:bg-slate-800/60">
          {files.map((f) => (
            <p key={`${f.name}-${f.size}`} className="truncate">{f.name}</p>
          ))}
        </div>
      )}
      <div>
        <label className="label">Observações (opcional)</label>
        <input className="input" placeholder="Ex.: hemograma de junho" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button onClick={submit} disabled={!files.length || busy} className="btn-primary w-full">
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> {stage || "Enviando..."}</>) : (<><Upload className="h-4 w-4" /> Enviar exames</>)}
      </button>
    </div>
  );
}
