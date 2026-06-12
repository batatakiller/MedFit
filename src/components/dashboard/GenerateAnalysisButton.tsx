"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

// Botão “Gerar nova análise” — dispara o grafo multiagente.
export function GenerateAnalysisButton({ label }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/assessment", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.redirect) return router.push(json.redirect);
        throw new Error(json.error ?? "erro");
      }
      router.push("/plano");
      router.refresh();
    } catch {
      setError("Não foi possível gerar a análise agora. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={generate} disabled={loading} className="btn-gradient">
        <Sparkles className="h-4 w-4" />
        {loading ? "Equipe de IA analisando..." : (label ?? "Gerar nova análise")}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
