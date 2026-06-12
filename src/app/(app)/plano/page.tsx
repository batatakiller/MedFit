import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, EducationalNotice } from "@/components/ui";
import { AIAnalysisPanel } from "@/components/ai/AgentPanels";
import { GenerateAnalysisButton } from "@/components/dashboard/GenerateAnalysisButton";
import type { AgentMessage } from "@/lib/ai/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Plano integrado" };
export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: assessment } = await supabase
    .from("ai_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: conversation } = assessment
    ? await supabase
        .from("agent_conversations")
        .select("agent_name, message_content")
        .eq("assessment_id", assessment.id)
        .order("seq")
    : { data: [] };

  const messages: AgentMessage[] = (conversation ?? []).map((m) => ({
    agent: m.agent_name as AgentMessage["agent"],
    message: m.message_content,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plano integrado 🧠"
        subtitle={assessment ? `Gerado em ${formatDate(assessment.created_at)} pela equipe multidisciplinar de IA.` : undefined}
        action={<GenerateAnalysisButton label={assessment ? "Ajustar estratégia" : "Gerar análise"} />}
      />
      {assessment ? (
        <AIAnalysisPanel assessment={assessment} conversation={messages} />
      ) : (
        <EmptyState
          title="Nenhum plano gerado ainda"
          description="Conclua o onboarding e gere sua primeira análise multiagente."
          action={<GenerateAnalysisButton label="Gerar primeira análise" />}
        />
      )}
      <EducationalNotice />
    </div>
  );
}
