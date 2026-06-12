"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export interface ExamRow {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  extracted_text: string | null;
  notes: string | null;
  uploaded_at: string;
}

export function ExamList({ exams }: { exams: ExamRow[] }) {
  const router = useRouter();
  const [openText, setOpenText] = useState<string | null>(null);

  async function view(exam: ExamRow) {
    const res = await fetch("/api/storage/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket: "exams", path: exam.file_url }),
    });
    const json = await res.json();
    if (json.url) window.open(json.url, "_blank", "noopener");
  }

  async function remove(exam: ExamRow) {
    if (!confirm(`Excluir o exame "${exam.file_name}"? Esta ação é definitiva.`)) return;
    const supabase = createClient();
    await supabase.storage.from("exams").remove([exam.file_url]);
    await supabase.from("exams").delete().eq("id", exam.id);
    router.refresh();
  }

  if (!exams.length) {
    return <p className="text-sm text-ink-soft">Nenhum exame enviado ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {exams.map((e) => (
        <div key={e.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tech-50 dark:bg-tech-950/50">
                <FileText className="h-5 w-5 text-tech-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{e.file_name}</p>
                <p className="text-xs text-ink-mute">
                  {formatDate(e.uploaded_at)}
                  {e.notes && <> · {e.notes}</>}
                  {e.extracted_text && <> · OCR ✓</>}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={() => view(e)} title="Visualizar" className="rounded-lg p-2 text-tech-600 hover:bg-tech-50">
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={() => remove(e)} title="Excluir" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {e.extracted_text && (
            <div className="mt-2">
              <button
                onClick={() => setOpenText(openText === e.id ? null : e.id)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                {openText === e.id ? "Ocultar texto extraído" : "Ver texto extraído (OCR)"}
              </button>
              {openText === e.id && (
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-ink-soft dark:bg-slate-800/60">
                  {e.extracted_text}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
