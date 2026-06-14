import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CHAT_AGENT_PROMPT } from "@/lib/ai/prompts";
import { aiAvailable, callAgentJSON } from "@/lib/ai/llm";
import { retrievePatientMemory } from "@/lib/rag/embeddings";
import { buildExamMarkdownContext } from "@/lib/exams/context";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const chatSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  history: z
    .array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(1200),
    }))
    .max(8)
    .optional(),
});

type ChatAnswer = {
  answer: string;
  referenced_data: string[];
  safety_warnings: string[];
  suggested_actions: string[];
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const parsed = chatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "pergunta inválida" }, { status: 400 });
  }

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

  try {
    const context = await buildAuthorizedChatContext(
      supabase,
      user.id,
      parsed.data.question
    );

    if (!context.hasAssessment && !context.hasProfile) {
      return NextResponse.json(
        { error: "complete o onboarding ou gere uma análise antes de usar o chat" },
        { status: 400 }
      );
    }

    if (!aiAvailable()) {
      return NextResponse.json({
        answer:
          "Ainda não há uma chave de IA configurada. Posso responder quando a integração estiver ativa.",
        referenced_data: [],
        safety_warnings: [
          "O Med Fit é apoio educacional e não substitui profissionais de saúde.",
        ],
        suggested_actions: ["Verifique a configuração da IA no ambiente do servidor."],
      } satisfies ChatAnswer);
    }

    const out = await callAgentJSON<ChatAnswer>({
      system: CHAT_AGENT_PROMPT,
      task: "chat",
      maxTokens: 1800,
      user: JSON.stringify({
        pergunta_do_usuario: parsed.data.question,
        historico_conversa_nao_confiavel: parsed.data.history ?? [],
        contexto_autorizado_do_servidor: context.payload,
      }),
    });

    return NextResponse.json({
      answer: String(out.answer ?? ""),
      referenced_data: Array.isArray(out.referenced_data) ? out.referenced_data : [],
      safety_warnings: Array.isArray(out.safety_warnings) ? out.safety_warnings : [],
      suggested_actions: Array.isArray(out.suggested_actions) ? out.suggested_actions : [],
    } satisfies ChatAnswer);
  } catch (e) {
    console.error("chat error:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "falha ao responder o chat" }, { status: 500 });
  }
}

async function buildAuthorizedChatContext(
  sb: SupabaseClient,
  userId: string,
  question: string
) {
  const [
    profileQ,
    healthQ,
    goalQ,
    latestAssessmentQ,
    mealPlanQ,
    workoutPlanQ,
    examsQ,
    scanQ,
    checkinsQ,
    memory,
  ] = await Promise.all([
    sb.from("profiles").select("name, age, sex, height, birth_date").eq("user_id", userId).maybeSingle(),
    sb.from("health_records").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("goals").select("*").eq("user_id", userId).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb
      .from("ai_assessments")
      .select("created_at, doctor_analysis, nutritionist_analysis, trainer_analysis, body_vision_analysis, integrated_plan, daily_mobile_plan, risk_alerts, confidence_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("meal_plans")
      .select("title, calories_estimate, protein, carbs, fats, water_goal_ml, breakfast, lunch, dinner, snacks, notes")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("workout_plans")
      .select("title, weekly_frequency, workout_days, progression_strategy, notes")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("exams")
      .select("file_name, extracted_text, uploaded_at")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false })
      .limit(20),
    sb
      .from("body_scan_sessions")
      .select("scan_date, body_fat_estimate, weight_at_scan, confidence_score, margin_of_error, body_scan_reports(body_composition_analysis, posture_analysis)")
      .eq("user_id", userId)
      .eq("status", "concluido")
      .order("scan_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("daily_checkins")
      .select("date, energy_level, diet_completed, workout_completed, slept_well, medication_completed, symptoms, pain, notes")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7),
    retrievePatientMemory(sb, userId, question, 6),
  ]);

  const examsMarkdown = buildExamMarkdownContext(examsQ.data ?? [], question, {
    maxExams: 20,
    maxCharsTotal: 22_000,
    maxCharsPerExam: 6_000,
  });

  return {
    hasProfile: Boolean(profileQ.data),
    hasAssessment: Boolean(latestAssessmentQ.data),
    payload: {
      perfil: profileQ.data ?? null,
      saude: healthQ.data ?? null,
      objetivo: goalQ.data ?? null,
      ultima_avaliacao_ia: latestAssessmentQ.data ?? null,
      plano_alimentar_ativo: mealPlanQ.data ?? null,
      plano_treino_ativo: workoutPlanQ.data ?? null,
      exames_recentes_markdown: examsMarkdown,
      body_scan_recente: scanQ.data ?? null,
      checkins_recentes: checkinsQ.data ?? [],
      memoria_relevante: memory,
      limites_da_resposta: [
        "Responder apenas sobre o paciente autenticado desta sessão.",
        "Não diagnosticar, prescrever ou alterar medicamentos.",
        "Recomendar validação presencial quando houver sintomas, exames alterados ou risco clínico.",
      ],
    },
  };
}
