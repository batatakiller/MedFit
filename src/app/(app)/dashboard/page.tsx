import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calcIMC } from "@/lib/calculations";
import { Card, EmptyState, PageHeader, SectionTitle, EducationalNotice } from "@/components/ui";
import { AlertsCard, DashboardCards, TimelineProgress } from "@/components/dashboard/DashboardCards";
import { GenerateAnalysisButton } from "@/components/dashboard/GenerateAnalysisButton";
import { BodyMeasurementChart, ProgressChart, AdherenceChart } from "@/components/charts/ProgressChart";
import {
  DoctorSportPanel, NutritionistPanel, TrainerPanel, BodyVisionPanel,
} from "@/components/ai/AgentPanels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [profileQ, healthQ, goalQ, measQ, assessQ, checkinsQ, scansQ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("health_records").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("body_measurements").select("*").eq("user_id", user.id).order("measurement_date", { ascending: true }).limit(24),
    supabase.from("ai_assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("daily_checkins").select("date, diet_completed, workout_completed").eq("user_id", user.id).order("date", { ascending: false }).limit(28),
    supabase.from("body_scan_sessions").select("scan_date, body_fat_estimate").eq("user_id", user.id).eq("status", "concluido").order("scan_date", { ascending: false }).limit(3),
  ]);

  const profile = profileQ.data;
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const meas = measQ.data ?? [];
  const latest = meas[meas.length - 1];
  const weight = latest?.weight ?? healthQ.data?.weight ?? null;
  const imc = calcIMC(weight, profile?.height);
  const assessment = assessQ.data;

  // evolução do mês: diferença para a medição ≥ 28 dias atrás
  const monthAgo = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const past = [...meas].reverse().find((m) => m.measurement_date <= monthAgo);
  const monthDelta = latest?.weight != null && past?.weight != null ? Number(latest.weight) - Number(past.weight) : null;

  const weightSeries = meas.map((m) => ({ date: formatDate(m.measurement_date), peso: m.weight ? Number(m.weight) : null }));
  const measureSeries = meas.map((m) => ({
    date: formatDate(m.measurement_date),
    cintura: m.waist ? Number(m.waist) : null,
    abdomen: m.abdomen ? Number(m.abdomen) : null,
    quadril: m.hip ? Number(m.hip) : null,
  }));

  // adesão semanal (4 semanas) a partir dos check-ins diários
  const checkins = checkinsQ.data ?? [];
  const weeks = [3, 2, 1, 0].map((w) => {
    const start = new Date(Date.now() - (w + 1) * 7 * 86400000);
    const end = new Date(Date.now() - w * 7 * 86400000);
    const inWeek = checkins.filter((c) => {
      const d = new Date(c.date);
      return d >= start && d < end;
    });
    const pct = (key: "diet_completed" | "workout_completed") =>
      inWeek.length ? Math.round((inWeek.filter((c) => c[key]).length / 7) * 100) : 0;
    return { label: w === 0 ? "Esta sem." : `${w} sem. atrás`, treino: pct("workout_completed"), dieta: pct("diet_completed") };
  });

  const nextCheckin = assessment
    ? new Date(new Date(assessment.created_at).getTime() + 30 * 86400000).toISOString()
    : null;

  const timeline = [
    ...(assessment ? [{ date: assessment.created_at, title: "Análise multiagente gerada", description: "Plano integrado atualizado pela equipe de IA" }] : []),
    ...(scansQ.data ?? []).map((s) => ({
      date: s.scan_date, title: "Body scan realizado",
      description: s.body_fat_estimate ? `Gordura estimada: ${s.body_fat_estimate}% (estimativa)` : undefined,
    })),
    ...(past ? [{ date: past.measurement_date, title: "Medidas registradas" }] : []),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${profile?.name?.split(" ")[0] ?? "paciente"}! 👋`}
        subtitle="Sua condição atual e o plano ativo, em um só lugar."
        action={<GenerateAnalysisButton label={assessment ? "Gerar nova análise" : "Gerar primeira análise"} />}
      />

      <DashboardCards
        imc={imc}
        weight={weight ? Number(weight) : null}
        targetWeight={healthQ.data?.target_weight ? Number(healthQ.data.target_weight) : null}
        goalType={goalQ.data?.goal_type ?? healthQ.data?.main_goal ?? null}
        monthDelta={monthDelta}
        nextCheckin={nextCheckin}
      />

      <AlertsCard alerts={assessment?.risk_alerts ?? []} />

      {assessment ? (
        <>
          <section>
            <SectionTitle
              title="Resumo da equipe multidisciplinar"
              subtitle={`Última análise: ${formatDate(assessment.created_at)}`}
              action={<Link href="/plano" className="text-sm font-semibold text-brand-600 hover:underline">Ver plano completo →</Link>}
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <DoctorSportPanel data={assessment.doctor_analysis} />
              <NutritionistPanel data={assessment.nutritionist_analysis} />
              <TrainerPanel data={assessment.trainer_analysis} />
              <BodyVisionPanel data={assessment.body_vision_analysis} />
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          title="Sua equipe de IA está pronta"
          description="Gere sua primeira análise multiagente: médico do esporte, nutricionista, treinador e análise corporal vão cruzar seus dados e montar seu plano integrado."
          action={<GenerateAnalysisButton label="Gerar primeira análise" />}
        />
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Evolução de peso" />
          {weightSeries.filter((w) => w.peso != null).length >= 2
            ? <ProgressChart data={weightSeries} />
            : <p className="text-sm text-ink-soft">Registre o peso ao menos 2 vezes para ver o gráfico.</p>}
        </Card>
        <Card>
          <SectionTitle title="Evolução de medidas" />
          {measureSeries.filter((m) => m.cintura != null).length >= 2
            ? <BodyMeasurementChart data={measureSeries} />
            : <p className="text-sm text-ink-soft">Atualize as medidas mensalmente para acompanhar aqui.</p>}
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Adesão ao plano (4 semanas)" subtitle="Baseado nos seus check-ins diários" />
          <AdherenceChart data={weeks} />
        </Card>
        <TimelineProgress events={timeline} />
      </section>

      <EducationalNotice />
    </div>
  );
}
