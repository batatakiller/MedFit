import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calcBMR, calcIMC, calcTDEE, imcCategory } from "@/lib/calculations";
import { Card, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { GOAL_LABELS } from "@/lib/validators";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [profileQ, healthQ, goalQ, trainingQ, subQ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("health_records").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("training_routines").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle(),
  ]);

  const p = profileQ.data;
  const h = healthQ.data;
  const imc = calcIMC(h?.weight, p?.height);
  const bmr = calcBMR({ weightKg: h?.weight, heightCm: p?.height, age: p?.age, sex: p?.sex });
  const tdee = calcTDEE(bmr, h?.activity_level);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <PageHeader
        title="Perfil do paciente 👤"
        action={<Link href="/onboarding" className="btn-secondary px-4 py-2 text-sm">Refazer onboarding</Link>}
      />

      <Card>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-white">
            {(p?.name ?? "P").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-extrabold">{p?.name}</p>
            <p className="text-sm text-ink-soft">{user.email}</p>
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
              <span className="chip bg-slate-100 text-slate-700">{p?.sex ?? "—"}</span>
              <span className="chip bg-slate-100 text-slate-700">{p?.age ?? "—"} anos</span>
              <span className="chip bg-slate-100 text-slate-700">{p?.height ?? "—"}cm</span>
              <span className="chip bg-brand-100 text-brand-800">{subQ.data?.plan ?? "gratuito"}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="IMC" value={imc ?? "—"} hint={imcCategory(imc)} accent="tech" />
        <StatCard label="Peso" value={h?.weight ? `${h.weight}kg` : "—"} accent="brand" />
        <StatCard label="TMB (est.)" value={bmr ? `${bmr} kcal` : "—"} hint="Taxa metabólica basal" accent="amber" />
        <StatCard label="Gasto diário (est.)" value={tdee ? `${tdee} kcal` : "—"} hint="TDEE" accent="amber" />
      </div>

      <Card>
        <SectionTitle title="Objetivo" />
        <p className="font-semibold">{GOAL_LABELS[goalQ.data?.goal_type ?? ""] ?? "Não definido"}</p>
        {goalQ.data?.desired_body_description && (
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">“{goalQ.data.desired_body_description}”</p>
        )}
        {goalQ.data?.target_date && (
          <p className="mt-1 text-xs text-ink-mute">Prazo: {formatDate(goalQ.data.target_date)}</p>
        )}
      </Card>

      <Card>
        <SectionTitle title="Saúde" />
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-ink-mute">Condições</dt><dd>{(h?.medical_conditions ?? []).join(", ").replace(/_/g, " ") || "Nenhuma relatada"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Lesões</dt><dd>{h?.injuries || "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Alergias</dt><dd>{h?.allergies || "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Restrições alimentares</dt><dd>{h?.dietary_restrictions || "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Sono</dt><dd>{h?.sleep_hours ? `${h.sleep_hours}h/noite` : "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Estresse</dt><dd>{h?.stress_level ?? "—"}</dd></div>
        </dl>
      </Card>

      <Card>
        <SectionTitle title="Treino" />
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-ink-mute">Experiência</dt><dd>{trainingQ.data?.experience_level ?? "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Frequência atual</dt><dd>{trainingQ.data?.frequency_per_week ?? 0}x/semana</dd></div>
          <div><dt className="font-semibold text-ink-mute">Horários</dt><dd>{trainingQ.data?.available_times || "—"}</dd></div>
          <div><dt className="font-semibold text-ink-mute">Equipamentos</dt><dd>{(trainingQ.data?.available_equipment ?? []).join(", ").replace(/_/g, " ") || "—"}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
