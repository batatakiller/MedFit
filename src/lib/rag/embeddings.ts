import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentResult } from "@/lib/ai/types";

// RAG do paciente — Supabase Vector (pgvector, 384 dims via Edge Function `embed`).
// Sem MEDFIT_EMBED_FUNCTION_URL: documentos ainda são salvos (memória textual),
// apenas a busca semântica fica desativada (fallback: documentos recentes).

const EMBED_URL = process.env.MEDFIT_EMBED_FUNCTION_URL;

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (!EMBED_URL || texts.length === 0) return null;
  try {
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { embeddings: number[][] };
    return json.embeddings;
  } catch {
    return null; // embeddings são best-effort; nunca derrubam a avaliação
  }
}

// Salva documento + embedding (quando disponível) na memória do paciente.
export async function savePatientDocument(
  sb: SupabaseClient,
  userId: string,
  doc: { type: string; title: string; content: string; metadata?: Record<string, unknown> }
) {
  const { data, error } = await sb
    .from("patient_documents")
    .insert({
      user_id: userId,
      type: doc.type,
      title: doc.title,
      content_text: doc.content.slice(0, 8000),
      metadata: doc.metadata ?? {},
    })
    .select("id")
    .single();
  if (error || !data) return null;

  const vectors = await embedTexts([doc.content.slice(0, 4000)]);
  await sb.from("patient_embeddings").insert({
    user_id: userId,
    document_id: data.id,
    content: doc.content.slice(0, 4000),
    embedding: vectors?.[0] ?? null,
    metadata: { type: doc.type },
  });
  return data.id as string;
}

// Busca semântica no histórico do paciente (fallback: documentos recentes).
export async function retrievePatientMemory(
  sb: SupabaseClient,
  userId: string,
  query: string,
  limit = 8
): Promise<string[]> {
  const vectors = await embedTexts([query]);
  if (vectors?.[0]) {
    const { data } = await sb.rpc("match_patient_documents", {
      p_user_id: userId,
      query_embedding: vectors[0],
      match_count: limit,
    });
    if (data?.length) {
      return (data as { title: string; content: string }[]).map(
        (d) => `[${d.title}] ${d.content.slice(0, 600)}`
      );
    }
  }
  const { data } = await sb
    .from("patient_documents")
    .select("title, content_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((d) => `[${d.title}] ${String(d.content_text).slice(0, 600)}`);
}

// Vetoriza os artefatos importantes de uma avaliação concluída.
export async function vectorizeAssessment(
  sb: SupabaseClient,
  userId: string,
  assessmentId: string,
  result: AssessmentResult
) {
  const docs = [
    { type: "avaliacao_ia", title: `Avaliação ${new Date().toLocaleDateString("pt-BR")}`,
      content: `${result.summary}\nCondição: ${result.current_condition}\nObjetivo: ${result.main_goal}` },
    { type: "plano_alimentar", title: "Estratégia nutricional",
      content: `${result.nutritionist.strategy}\n${JSON.stringify(result.nutritionist.meal_plan)}` },
    { type: "plano_treino", title: "Estratégia de treino",
      content: `${result.trainer.progression}\n${result.trainer.weekly_plan.map((d) => d.name).join("; ")}` },
    { type: "relatorio_corporal", title: "Análise corporal",
      content: `${result.body_vision.analysis} Confiança: ${result.body_vision.confidence_level}, erro: ${result.body_vision.margin_of_error}` },
    { type: "conversa_agentes", title: "Discussão dos agentes",
      content: result.agent_discussion.map((m) => `${m.agent}: ${m.message}`).join("\n") },
    { type: "decisao_agentes", title: "Decisão final",
      content: `${result.integrated_plan.next_30_days}\nMetas: ${result.integrated_plan.monthly_goals.join("; ")}` },
    ...(result.risk_alerts.length
      ? [{ type: "alerta_medico", title: "Alertas de risco", content: result.risk_alerts.join("\n") }]
      : []),
  ];
  for (const d of docs) {
    await savePatientDocument(sb, userId, { ...d, metadata: { assessment_id: assessmentId } });
  }
}
