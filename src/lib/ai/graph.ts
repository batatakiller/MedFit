import "server-only";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentMessage, AgentSection, AssessmentResult, BodyVisionSection, DailyMobilePlan,
  IntegratedPlanSection, NutritionSection, PatientContext, SafetyValidation, TrainerSection,
} from "./types";
import {
  BODY_VISION_AGENT_PROMPT, DAILY_PLAN_PROMPT, DISCUSSION_PROMPT, INTEGRATED_PLAN_PROMPT,
  MEDICAL_AGENT_PROMPT, NUTRITION_AGENT_PROMPT, SAFETY_VALIDATION_PROMPT, TRAINING_AGENT_PROMPT,
  patientToPrompt,
} from "./prompts";
import { aiAvailable, callAgentJSON } from "./llm";
import {
  hasClinicalRisk, mockBodyVision, mockDailyPlan, mockDiscussion, mockDoctor,
  mockIntegrated, mockNutritionist, mockSafety, mockTrainer,
} from "./mock";
import { retrievePatientMemory, vectorizeAssessment } from "@/lib/rag/embeddings";
import { buildExamMarkdownContext } from "@/lib/exams/context";

// ════════════════════════════════════════════════════════════════════════
// Grafo LangGraph — orquestração multiagente do Med Fit
//
// START → CollectPatientData → RetrievePatientMemory → ExamAnalysis →
// BodyVisionAnalysis → MedicalSportAgent → NutritionAgent → TrainingAgent →
// AgentDiscussion → SafetyValidation →(seguro)→ IntegratedPlan →
// GenerateDailyPlan → SaveAssessment → END
//
// Regras: o médico tem prioridade em risco; o SafetyValidationNode pode
// devolver o fluxo para AgentDiscussion (1 revisão) se o plano não for seguro.
// ════════════════════════════════════════════════════════════════════════

const AssessmentState = Annotation.Root({
  patient: Annotation<PatientContext>,
  memory: Annotation<string[]>,
  examFindings: Annotation<string | null>,
  bodyVision: Annotation<BodyVisionSection | null>,
  doctor: Annotation<(AgentSection & { risk_level?: string }) | null>,
  nutrition: Annotation<NutritionSection | null>,
  trainer: Annotation<TrainerSection | null>,
  discussion: Annotation<AgentMessage[]>,
  safety: Annotation<SafetyValidation | null>,
  integrated: Annotation<(IntegratedPlanSection & {
    summary: string; current_condition: string; main_goal: string;
    risk_alerts: string[]; confidence_score: number;
  }) | null>,
  dailyPlan: Annotation<DailyMobilePlan | null>,
  revisionCount: Annotation<number>,
  assessmentId: Annotation<string | null>,
});

type S = typeof AssessmentState.State;

export interface GraphDeps {
  supabase: SupabaseClient; // cliente com sessão do usuário (RLS ativa)
  userId: string;
}

export function buildAssessmentGraph(deps: GraphDeps) {
  const useReal = aiAvailable();

  // 1) Coleta/normalização dos dados (o contexto já chega montado pela API;
  //    este nó valida o mínimo necessário para o restante do fluxo)
  const collectPatientData = async (state: S): Promise<Partial<S>> => {
    if (!state.patient?.userId) throw new Error("paciente sem dados mínimos");
    return { revisionCount: 0, discussion: [], memory: state.memory ?? [] };
  };

  // 2) Memória longitudinal (RAG via pgvector) — recupera histórico relevante
  const retrieveMemory = async (state: S): Promise<Partial<S>> => {
    const memory = await retrievePatientMemory(
      deps.supabase,
      deps.userId,
      `objetivo ${state.patient.goalType}; condições ${state.patient.medicalConditions.join(",")}; evolução, dificuldades e planos anteriores`
    );
    return { memory };
  };

  // 3) Exames (texto OCR já extraído no upload) — consolida achados
  const examAnalysis = async (state: S): Promise<Partial<S>> => {
    const { data } = await deps.supabase
      .from("exams")
      .select("file_name, extracted_text, uploaded_at")
      .eq("user_id", deps.userId)
      .order("uploaded_at", { ascending: false })
      .limit(12);
    const context = buildExamMarkdownContext(
      data ?? [],
      "exames laboratoriais marcadores hormonais testosterona glicose colesterol vitaminas tireoide hemograma alterações referência",
      { maxExams: 12, maxCharsTotal: 18_000, maxCharsPerExam: 4_500 }
    );
    return { examFindings: context || null };
  };

  // 4) Body Vision — interpreta o resultado técnico do pipeline de imagem
  const bodyVisionAnalysis = async (state: S): Promise<Partial<S>> => {
    const p = { ...state.patient, examFindings: state.examFindings };
    if (useReal && p.bodyScanSummary) {
      const out = await callAgentJSON<BodyVisionSection>({
        system: BODY_VISION_AGENT_PROMPT,
        user: patientToPrompt(p, { memoria_relevante: state.memory }),
        task: "bodyVision",
      });
      return { bodyVision: out, patient: p };
    }
    return { bodyVision: mockBodyVision(p), patient: p };
  };

  // 5) Médico do esporte — prioridade em casos de risco
  const medicalAgent = async (state: S): Promise<Partial<S>> => {
    if (useReal) {
      const out = await callAgentJSON<AgentSection & { risk_level: string }>({
        system: MEDICAL_AGENT_PROMPT,
        user: patientToPrompt(state.patient, {
          memoria_relevante: state.memory,
          relatorio_body_vision: state.bodyVision,
        }),
        task: "medical",
      });
      return { doctor: out };
    }
    return { doctor: mockDoctor(state.patient) };
  };

  // 6) Nutricionista — recebe o parecer médico (não cria dieta agressiva sob risco)
  const nutritionAgent = async (state: S): Promise<Partial<S>> => {
    const risk = (state.doctor?.risk_level ?? "baixo") !== "baixo";
    if (useReal) {
      const out = await callAgentJSON<NutritionSection>({
        system: NUTRITION_AGENT_PROMPT,
        user: patientToPrompt(state.patient, {
          parecer_medico: state.doctor,
          relatorio_body_vision: state.bodyVision,
          memoria_relevante: state.memory,
        }),
        task: "nutrition",
      });
      return { nutrition: out };
    }
    return { nutrition: mockNutritionist(state.patient, risk) };
  };

  // 7) Treinador — recebe médico + body vision (sem treino intenso sob risco)
  const trainingAgent = async (state: S): Promise<Partial<S>> => {
    const risk = (state.doctor?.risk_level ?? "baixo") !== "baixo";
    if (useReal) {
      const out = await callAgentJSON<TrainerSection>({
        system: TRAINING_AGENT_PROMPT,
        user: patientToPrompt(state.patient, {
          parecer_medico: state.doctor,
          relatorio_body_vision: state.bodyVision,
          estrategia_nutricional: state.nutrition?.strategy,
        }),
        task: "training",
      });
      return { trainer: out };
    }
    return { trainer: mockTrainer(state.patient, risk) };
  };

  // 8) Discussão entre agentes (cruzamento de dados, moderada pelo supervisor)
  const agentDiscussion = async (state: S): Promise<Partial<S>> => {
    const risk = (state.doctor?.risk_level ?? "baixo") !== "baixo";
    if (useReal) {
      const out = await callAgentJSON<{ agent_discussion: AgentMessage[] }>({
        system: DISCUSSION_PROMPT,
        user: JSON.stringify({
          revisao: state.revisionCount > 0 ? state.safety?.warnings : undefined,
          medico: state.doctor, nutricionista: state.nutrition,
          treinador: state.trainer, body_vision: state.bodyVision,
        }),
        task: "discussion",
      });
      return { discussion: out.agent_discussion };
    }
    return { discussion: mockDiscussion(state.patient, risk) };
  };

  // 9) Validação de segurança ANTES do plano final
  const safetyValidation = async (state: S): Promise<Partial<S>> => {
    if (useReal) {
      const payload = {
        paciente: {
          condicoes: state.patient.medicalConditions,
          medicamentos: state.patient.medications,
          imc: state.patient.imc,
          nivel: state.patient.experienceLevel,
        },
        medico: state.doctor, nutricionista: state.nutrition, treinador: state.trainer,
      };
      const primary = await callAgentJSON<SafetyValidation>({
        system: SAFETY_VALIDATION_PROMPT,
        user: JSON.stringify(payload),
        task: "safety",
      });
      const review = process.env.OPENROUTER_API_KEY
        ? await callAgentJSON<SafetyValidation>({
            system: SAFETY_VALIDATION_PROMPT,
            user: JSON.stringify({
              ...payload,
              validacao_primaria: primary,
              instrucao:
                "Faça uma revisão independente e conservadora. Se houver conflito, sinalize inseguro.",
            }),
            task: "safetyReview",
          })
        : null;
      return { safety: mergeSafetyValidations(primary, review), revisionCount: state.revisionCount + 1 };
    }
    const risk = hasClinicalRisk(state.patient);
    return { safety: mockSafety(state.patient, risk), revisionCount: state.revisionCount + 1 };
  };

  // 10) Plano final integrado (consolidação do supervisor)
  const integratedPlan = async (state: S): Promise<Partial<S>> => {
    const risk = (state.doctor?.risk_level ?? "baixo") !== "baixo";
    if (useReal) {
      const out = await callAgentJSON<S["integrated"]>({
        system: INTEGRATED_PLAN_PROMPT,
        user: JSON.stringify({
          paciente: patientToPrompt(state.patient),
          medico: state.doctor, nutricionista: state.nutrition, treinador: state.trainer,
          body_vision: state.bodyVision, validacao_seguranca: state.safety,
          discussao: state.discussion,
        }),
        task: "integrated",
      });
      return { integrated: out };
    }
    return { integrated: mockIntegrated(state.patient, risk) };
  };

  // 11) Plano diário para o mobile
  const generateDailyPlan = async (state: S): Promise<Partial<S>> => {
    if (useReal) {
      const out = await callAgentJSON<DailyMobilePlan>({
        system: DAILY_PLAN_PROMPT,
        user: JSON.stringify({
          plano_integrado: state.integrated, treino: state.trainer?.weekly_plan,
          dieta: state.nutrition?.meal_plan, meta_agua_ml: state.patient.waterGoalMl,
          medicamentos_cadastrados: state.patient.medications,
        }),
        task: "daily",
      });
      return { dailyPlan: out };
    }
    return { dailyPlan: mockDailyPlan(state.patient, state.trainer!, state.nutrition!) };
  };

  // 12) Persistência: avaliação, conversa, decisões, planos e vetorização
  const saveAssessment = async (state: S): Promise<Partial<S>> => {
    const sb = deps.supabase;
    const result = stateToResult(state, !useReal);

    const { data: assessment, error } = await sb
      .from("ai_assessments")
      .insert({
        user_id: deps.userId,
        doctor_analysis: state.doctor,
        nutritionist_analysis: state.nutrition,
        trainer_analysis: state.trainer,
        body_vision_analysis: state.bodyVision,
        integrated_plan: state.integrated,
        daily_mobile_plan: state.dailyPlan,
        risk_alerts: result.risk_alerts,
        next_steps: state.integrated?.next_checkin
          ? `Reavaliação em ${state.integrated.next_checkin}`
          : null,
        confidence_score: result.confidence_score,
        raw_json: result,
        is_mock: !useReal,
      })
      .select("id")
      .single();
    if (error) throw new Error(`falha ao salvar avaliação: ${error.code}`);

    const assessmentId = assessment.id as string;

    // conversa dos agentes
    if (state.discussion.length) {
      await sb.from("agent_conversations").insert(
        state.discussion.map((m, i) => ({
          user_id: deps.userId, assessment_id: assessmentId,
          agent_name: m.agent, message_role: "agent",
          message_content: m.message, seq: i,
        }))
      );
    }

    // decisões finais
    await sb.from("agent_decisions").insert({
      user_id: deps.userId, assessment_id: assessmentId,
      supervisor_summary: result.summary,
      doctor_decision: state.doctor?.analysis ?? null,
      nutritionist_decision: state.nutrition?.strategy ?? null,
      trainer_decision: state.trainer?.progression ?? null,
      body_vision_decision: state.bodyVision?.analysis ?? null,
      final_integrated_decision: state.integrated?.next_30_days ?? null,
    });

    // plano alimentar + plano de treino ativos
    if (state.nutrition) {
      await sb.from("meal_plans").update({ active: false }).eq("user_id", deps.userId);
      await sb.from("meal_plans").insert({
        user_id: deps.userId, assessment_id: assessmentId,
        title: `Plano alimentar — ${result.main_goal}`,
        calories_estimate: state.nutrition.calories_estimate ?? null,
        protein: state.nutrition.protein ?? null,
        carbs: state.nutrition.carbs ?? null,
        fats: state.nutrition.fats ?? null,
        breakfast: state.nutrition.meal_plan.breakfast,
        lunch: state.nutrition.meal_plan.lunch,
        dinner: state.nutrition.meal_plan.dinner,
        snacks: state.nutrition.meal_plan.snacks,
        water_goal_ml: state.patient.waterGoalMl,
        notes: state.nutrition.warnings?.join(" ") ?? null,
        active: true,
      });
    }
    if (state.trainer) {
      await sb.from("workout_plans").update({ active: false }).eq("user_id", deps.userId);
      await sb.from("workout_plans").insert({
        user_id: deps.userId,
        title: `Plano de treino — ${result.main_goal}`,
        weekly_frequency: state.trainer.weekly_plan.length,
        workout_days: state.trainer.weekly_plan,
        progression_strategy: state.trainer.progression,
        notes: state.trainer.warnings?.join(" ") ?? null,
        active: true,
      });
    }

    // memória longitudinal (documentos + embeddings quando configurado)
    await vectorizeAssessment(sb, deps.userId, assessmentId, result);

    return { assessmentId };
  };

  // ── Montagem do grafo ───────────────────────────────────────────────────
  const graph = new StateGraph(AssessmentState)
    .addNode("CollectPatientDataNode", collectPatientData)
    .addNode("RetrievePatientMemoryNode", retrieveMemory)
    .addNode("ExamAnalysisNode", examAnalysis)
    .addNode("BodyVisionAnalysisNode", bodyVisionAnalysis)
    .addNode("MedicalSportAgentNode", medicalAgent)
    .addNode("NutritionAgentNode", nutritionAgent)
    .addNode("TrainingAgentNode", trainingAgent)
    .addNode("AgentDiscussionNode", agentDiscussion)
    .addNode("SafetyValidationNode", safetyValidation)
    .addNode("IntegratedPlanNode", integratedPlan)
    .addNode("GenerateDailyPlanNode", generateDailyPlan)
    .addNode("SaveAssessmentNode", saveAssessment)
    .addEdge(START, "CollectPatientDataNode")
    .addEdge("CollectPatientDataNode", "RetrievePatientMemoryNode")
    .addEdge("RetrievePatientMemoryNode", "ExamAnalysisNode")
    .addEdge("ExamAnalysisNode", "BodyVisionAnalysisNode")
    .addEdge("BodyVisionAnalysisNode", "MedicalSportAgentNode")
    .addEdge("MedicalSportAgentNode", "NutritionAgentNode")
    .addEdge("NutritionAgentNode", "TrainingAgentNode")
    .addEdge("TrainingAgentNode", "AgentDiscussionNode")
    .addEdge("AgentDiscussionNode", "SafetyValidationNode")
    // Supervisor: se o plano não for seguro, força UMA revisão da discussão.
    .addConditionalEdges("SafetyValidationNode", (state: S) => {
      if (!state.safety?.is_safe && state.revisionCount < 2) return "AgentDiscussionNode";
      return "IntegratedPlanNode";
    }, ["AgentDiscussionNode", "IntegratedPlanNode"])
    .addEdge("IntegratedPlanNode", "GenerateDailyPlanNode")
    .addEdge("GenerateDailyPlanNode", "SaveAssessmentNode")
    .addEdge("SaveAssessmentNode", END);

  return graph.compile();
}

function mergeSafetyValidations(
  primary: SafetyValidation,
  review: SafetyValidation | null
): SafetyValidation {
  if (!review) return primary;

  const warnings = Array.from(new Set([
    ...(primary.warnings ?? []),
    ...(review.warnings ?? []),
  ]));

  return {
    is_safe: primary.is_safe && review.is_safe,
    warnings,
    requires_professional_followup:
      primary.requires_professional_followup || review.requires_professional_followup,
    reason: [
      `Validação primária: ${primary.reason}`,
      `Revisão secundária: ${review.reason}`,
    ].join(" "),
  };
}

function stateToResult(state: S, isMock: boolean): AssessmentResult {
  return {
    summary: state.integrated?.summary ?? "",
    current_condition: state.integrated?.current_condition ?? "",
    main_goal: state.integrated?.main_goal ?? "",
    risk_alerts: state.integrated?.risk_alerts ?? [],
    doctor_sport: {
      analysis: state.doctor?.analysis ?? "",
      recommendations: state.doctor?.recommendations ?? [],
      warnings: state.doctor?.warnings ?? [],
    },
    nutritionist: state.nutrition ?? {
      analysis: "", strategy: "", recommendations: [],
      meal_plan: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    },
    trainer: state.trainer ?? { analysis: "", weekly_plan: [], progression: "", recommendations: [] },
    body_vision: state.bodyVision ?? {
      analysis: "", estimated_measurements: {}, body_composition_estimate: {},
      posture_analysis: {}, confidence_level: "baixa", margin_of_error: "n/d", recommendations: [],
    },
    daily_mobile_plan: state.dailyPlan ?? {
      today_summary: "", workout_today: [], meals_today: [],
      water_goal_ml: state.patient.waterGoalMl, medication_reminders: [], daily_checklist: [],
    },
    agent_discussion: state.discussion,
    integrated_plan: {
      next_30_days: state.integrated?.next_30_days ?? "",
      monthly_goals: state.integrated?.monthly_goals ?? [],
      habits: state.integrated?.habits ?? [],
      metrics_to_track: state.integrated?.metrics_to_track ?? [],
      next_checkin: state.integrated?.next_checkin ?? "30 dias",
    },
    safety_validation: state.safety ?? {
      is_safe: true, warnings: [], requires_professional_followup: false, reason: "",
    },
    confidence_score: state.integrated?.confidence_score ?? 0.7,
    is_mock: isMock,
  };
}

export type { S as AssessmentGraphState };
