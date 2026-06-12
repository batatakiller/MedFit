// Painéis dos agentes — DoctorSportPanel, NutritionistPanel, TrainerPanel,
// BodyVisionPanel, AgentConversationPanel, AIAnalysisPanel, IntegratedPlan.
import {
  Apple, Brain, Camera, Dumbbell, MessageSquare, Stethoscope,
} from "lucide-react";
import { Card, ConfidenceScoreBadge, SafetyWarningCard } from "@/components/ui";
import type { AgentMessage } from "@/lib/ai/types";

type Json = Record<string, unknown> | null | undefined;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

function AgentCard({
  icon: Icon, color, title, analysis, lists,
}: {
  icon: React.ElementType; color: string; title: string; analysis: string;
  lists: { label: string; items: string[]; tone?: "warn" }[];
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </span>
        <h3 className="font-bold">{title}</h3>
      </div>
      {analysis && <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{analysis}</p>}
      {lists.map(
        (l) =>
          l.items.length > 0 && (
            <div key={l.label} className="mt-3">
              <p className={`text-xs font-bold uppercase tracking-wide ${l.tone === "warn" ? "text-rose-600" : "text-ink-mute"}`}>
                {l.label}
              </p>
              <ul className="mt-1 space-y-1 text-sm text-ink-soft dark:text-slate-300">
                {l.items.map((it, i) => (
                  <li key={i} className="flex gap-2"><span>•</span>{it}</li>
                ))}
              </ul>
            </div>
          )
      )}
    </Card>
  );
}

export function DoctorSportPanel({ data }: { data: Json }) {
  return (
    <AgentCard
      icon={Stethoscope} color="bg-tech-600" title="Médico do Esporte"
      analysis={str(data?.analysis)}
      lists={[
        { label: "Recomendações", items: arr(data?.recommendations) },
        { label: "Avisos", items: arr(data?.warnings), tone: "warn" },
      ]}
    />
  );
}

export function NutritionistPanel({ data }: { data: Json }) {
  return (
    <AgentCard
      icon={Apple} color="bg-brand-600" title="Nutricionista"
      analysis={str(data?.analysis) || str(data?.strategy)}
      lists={[
        { label: "Estratégia", items: data?.analysis && data?.strategy ? [str(data.strategy)] : [] },
        { label: "Recomendações", items: arr(data?.recommendations) },
        { label: "Avisos", items: arr(data?.warnings), tone: "warn" },
      ]}
    />
  );
}

export function TrainerPanel({ data }: { data: Json }) {
  return (
    <AgentCard
      icon={Dumbbell} color="bg-amber-500" title="Treinador Físico"
      analysis={str(data?.analysis)}
      lists={[
        { label: "Progressão", items: data?.progression ? [str(data.progression)] : [] },
        { label: "Recomendações", items: arr(data?.recommendations) },
        { label: "Avisos", items: arr(data?.warnings), tone: "warn" },
      ]}
    />
  );
}

export function BodyVisionPanel({ data }: { data: Json }) {
  const conf = str(data?.confidence_level);
  const margin = str(data?.margin_of_error);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <h3 className="font-bold">Análise Corporal por Imagem</h3>
      </div>
      {str(data?.analysis) && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{str(data?.analysis)}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {conf && <span className="chip bg-purple-100 text-purple-800">Confiança: {conf}</span>}
        {margin && <span className="chip bg-slate-100 text-slate-600">Margem de erro: {margin}</span>}
      </div>
      {arr(data?.recommendations).length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink-soft dark:text-slate-300">
          {arr(data?.recommendations).map((r, i) => (
            <li key={i} className="flex gap-2"><span>•</span>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink-mute">
        Estimativa por imagem — não substitui bioimpedância, adipometria, DEXA ou avaliação presencial.
      </p>
    </Card>
  );
}

// AgentConversationPanel — a conversa entre os agentes
const agentMeta: Record<string, { label: string; color: string }> = {
  medico_esporte: { label: "Médico do Esporte", color: "bg-tech-100 text-tech-800" },
  nutricionista: { label: "Nutricionista", color: "bg-brand-100 text-brand-800" },
  treinador: { label: "Treinador", color: "bg-amber-100 text-amber-800" },
  body_vision: { label: "Visão Corporal", color: "bg-purple-100 text-purple-800" },
  supervisor: { label: "Supervisor", color: "bg-slate-200 text-slate-800" },
};

export function AgentConversationPanel({ messages }: { messages: AgentMessage[] }) {
  if (!messages.length) return null;
  return (
    <Card>
      <div className="flex items-center gap-2 font-bold">
        <MessageSquare className="h-5 w-5 text-brand-600" /> Conversa entre os agentes
      </div>
      <div className="mt-4 space-y-3">
        {messages.map((m, i) => {
          const meta = agentMeta[m.agent] ?? agentMeta.supervisor;
          const isSupervisor = m.agent === "supervisor";
          return (
            <div key={i} className={`rounded-xl p-3 text-sm ${isSupervisor ? "border border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/30" : "bg-slate-50 dark:bg-slate-800/60"}`}>
              <span className={`chip ${meta.color}`}>{meta.label}</span>
              <p className="mt-1.5 leading-relaxed text-ink-soft dark:text-slate-300">{m.message}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// IntegratedPlan — plano final consolidado pelo supervisor
export function IntegratedPlan({
  plan, riskAlerts, confidence,
}: {
  plan: Json; riskAlerts: string[]; confidence?: number | null;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold">
          <Brain className="h-5 w-5 text-brand-600" /> Plano integrado — próximos 30 dias
        </div>
        <ConfidenceScoreBadge score={confidence} />
      </div>
      {str(plan?.next_30_days) && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{str(plan?.next_30_days)}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          ["Metas do mês", arr(plan?.monthly_goals)],
          ["Hábitos", arr(plan?.habits)],
          ["Indicadores", arr(plan?.metrics_to_track)],
        ].map(([label, items]) => (
          <div key={label as string} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">{label as string}</p>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-soft dark:text-slate-300">
              {(items as string[]).map((g, i) => <li key={i}>• {g}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {str(plan?.next_checkin) && (
        <p className="mt-4 text-sm font-semibold text-tech-700">Próxima reavaliação: {str(plan?.next_checkin)}</p>
      )}
      <div className="mt-4">
        <SafetyWarningCard warnings={riskAlerts} />
      </div>
    </Card>
  );
}

// AIAnalysisPanel — agrupa tudo de uma avaliação
export function AIAnalysisPanel({
  assessment,
  conversation,
}: {
  assessment: {
    doctor_analysis: Json; nutritionist_analysis: Json; trainer_analysis: Json;
    body_vision_analysis: Json; integrated_plan: Json;
    risk_alerts: string[] | null; confidence_score: number | null; is_mock: boolean;
  };
  conversation: AgentMessage[];
}) {
  return (
    <div className="space-y-5">
      {assessment.is_mock && (
        <p className="rounded-xl border border-tech-200 bg-tech-50 p-3 text-sm text-tech-800">
          Análise gerada pelo <b>modo demonstração</b> (mock multiagente). Configure a chave da API
          de IA para análises com a equipe real de agentes.
        </p>
      )}
      <IntegratedPlan
        plan={assessment.integrated_plan}
        riskAlerts={assessment.risk_alerts ?? []}
        confidence={assessment.confidence_score}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <DoctorSportPanel data={assessment.doctor_analysis} />
        <NutritionistPanel data={assessment.nutritionist_analysis} />
        <TrainerPanel data={assessment.trainer_analysis} />
        <BodyVisionPanel data={assessment.body_vision_analysis} />
      </div>
      <AgentConversationPanel messages={conversation} />
    </div>
  );
}
