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
