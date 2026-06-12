import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPatientContext } from "@/lib/patient-context";
import { buildAssessmentGraph } from "@/lib/ai/graph";
import { aiAvailable } from "@/lib/ai/llm";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/ai/assessment — executa o grafo multiagente e salva a avaliação.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  try {
    // consentimento de dados sensíveis é pré-requisito para análise por IA
    const { data: consent } = await supabase
      .from("consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_type", "dados_sensiveis")
      .eq("accepted", true)
      .limit(1)
      .maybeSingle();
    if (!consent) {
      return NextResponse.json(
        { error: "consentimento necessário", redirect: "/consentimento" },
        { status: 403 }
      );
    }

    const patient = await buildPatientContext(supabase, user.id);
    if (!patient.weightKg || !patient.heightCm) {
      return NextResponse.json(
        { error: "complete o onboarding antes de gerar a análise", redirect: "/onboarding" },
        { status: 400 }
      );
    }

    const graph = buildAssessmentGraph({ supabase, userId: user.id });
    const finalState = await graph.invoke({ patient, memory: [] });

    return NextResponse.json({
      ok: true,
      assessmentId: finalState.assessmentId,
      mode: aiAvailable() ? "ia" : "mock",
    });
  } catch (e) {
    // nunca logar dados clínicos — apenas o tipo do erro
    console.error("assessment error:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "falha ao gerar análise" }, { status: 500 });
  }
}
