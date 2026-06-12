"use client";

// OCR básico de exames (imagens) no NAVEGADOR via tesseract.js — o conteúdo
// do exame não passa por servidores de terceiros. PDFs: o arquivo é salvo no
// bucket privado e o texto pode ser colado manualmente ou extraído em versão
// futura (pdf.js / Edge Function).

export async function extractTextFromImage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text?.trim() ?? "";
  } finally {
    await worker.terminate();
  }
}

export function isOcrSupported(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

export function isPdf(file: File) {
  return file.type === "application/pdf";
}

// Extrai texto de PDFs com camada de texto (a maioria dos laudos laboratoriais).
// PDFs escaneados (só imagem) retornam vazio — o arquivo fica salvo mesmo assim.
export async function extractTextFromPdf(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise;
  const maxPages = Math.min(doc.numPages, 20);
  const parts: string[] = [];
  try {
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      parts.push(
        content.items
          .map((it) => ("str" in it ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      );
      onProgress?.(Math.round((i / maxPages) * 100));
    }
  } finally {
    await task.destroy();
  }
  return parts.filter(Boolean).join("\n\n").trim();
}
