import "server-only";

export type ExamTextRow = {
  file_name: string;
  uploaded_at?: string | null;
  extracted_text?: string | null;
};

const STOPWORDS = new Set([
  "a", "as", "o", "os", "um", "uma", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "e", "ou", "para", "por", "com", "sem", "me", "meu", "minha", "meus", "minhas", "qual", "quais",
  "eram", "era", "sao", "são", "estao", "estão", "tenho", "dos", "das", "nos", "nas", "exames",
  "exame", "importados", "importado", "resultado", "resultados", "taxa", "taxas", "valor", "valores",
]);

const DOMAIN_ALIASES: Record<string, string[]> = {
  testosterona: ["testosterona", "testosterone", "testosterona total", "testosterona livre", "shbg", "ng/dl"],
  glicose: ["glicose", "glucose", "hemoglobina glicada", "hba1c"],
  colesterol: ["colesterol", "hdl", "ldl", "vldl", "triglicerides", "triglicérides"],
  vitamina: ["vitamina", "25-oh", "25 oh", "vit d", "b12", "folato"],
  tireoide: ["tireoide", "tsh", "t3", "t4", "t4 livre"],
  ferro: ["ferro", "ferritina", "transferrina"],
};

export function buildExamMarkdownContext(
  exams: ExamTextRow[],
  query: string,
  opts?: { maxExams?: number; maxCharsTotal?: number; maxCharsPerExam?: number }
) {
  const maxExams = opts?.maxExams ?? 12;
  const maxCharsTotal = opts?.maxCharsTotal ?? 18_000;
  const maxCharsPerExam = opts?.maxCharsPerExam ?? 5_000;
  const terms = queryTerms(query);
  let remaining = maxCharsTotal;
  const blocks: string[] = [];

  for (const exam of exams.slice(0, maxExams)) {
    if (remaining <= 0) break;
    const text = String(exam.extracted_text ?? "").replace(/\s+/g, " ").trim();
    if (!text) {
      blocks.push(`### ${exam.file_name}\nData: ${exam.uploaded_at ?? "n/d"}\nTexto extraído indisponível.`);
      continue;
    }

    const snippets = relevantSnippets(text, terms, Math.min(maxCharsPerExam, remaining));
    const content = snippets.length ? snippets.join("\n\n---\n\n") : text.slice(0, Math.min(1800, remaining));
    const block = [
      `### ${exam.file_name}`,
      `Data: ${exam.uploaded_at ?? "n/d"}`,
      snippets.length ? "Trechos relevantes encontrados no texto extraído:" : "Início do texto extraído:",
      content,
    ].join("\n");

    blocks.push(block);
    remaining -= block.length;
  }

  return blocks.join("\n\n");
}

function queryTerms(query: string) {
  const normalized = normalize(query);
  const base = normalized
    .split(/[^a-z0-9%/-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

  const terms = new Set(base);
  for (const token of base) {
    for (const [key, aliases] of Object.entries(DOMAIN_ALIASES)) {
      if (token.includes(key) || key.includes(token)) aliases.forEach((alias) => terms.add(normalize(alias)));
    }
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

function relevantSnippets(text: string, terms: string[], maxChars: number) {
  const normalizedText = normalize(text);
  const windows: { start: number; end: number; score: number }[] = [];
  const radius = 700;

  for (const term of terms) {
    let index = normalizedText.indexOf(term);
    while (index >= 0 && windows.length < 80) {
      windows.push({
        start: Math.max(0, index - radius),
        end: Math.min(text.length, index + term.length + radius),
        score: term.length,
      });
      index = normalizedText.indexOf(term, index + term.length);
    }
  }

  if (!windows.length) return [];

  const merged = windows
    .sort((a, b) => a.start - b.start)
    .reduce<{ start: number; end: number; score: number }[]>((acc, current) => {
      const last = acc[acc.length - 1];
      if (last && current.start <= last.end + 120) {
        last.end = Math.max(last.end, current.end);
        last.score += current.score;
      } else {
        acc.push({ ...current });
      }
      return acc;
    }, [])
    .sort((a, b) => b.score - a.score);

  const snippets: string[] = [];
  let used = 0;
  for (const window of merged) {
    if (used >= maxChars) break;
    const piece = text.slice(window.start, window.end).trim();
    const clipped = piece.slice(0, Math.max(0, maxChars - used));
    snippets.push(`${window.start > 0 ? "..." : ""}${clipped}${window.end < text.length ? "..." : ""}`);
    used += clipped.length;
  }
  return snippets;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
