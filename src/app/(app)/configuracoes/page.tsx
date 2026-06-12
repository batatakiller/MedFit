import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import {
  DarkModeToggle, DeleteAccountButton, DeletePhotosExamsButton,
  ExportDataButton, LogoutButton, NotificationToggle,
} from "@/components/dashboard/SettingsActions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

const consentLabels: Record<string, string> = {
  termos_uso: "Termos de uso",
  privacidade: "Política de privacidade",
  dados_sensiveis: "Dados sensíveis de saúde",
  exames: "Armazenamento de exames",
  fotos_corporais: "Análise corporal por fotos",
  lembretes_medicamentos: "Lembretes de medicamentos cadastrados",
};

export default async function ConfiguracoesPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("consent_type, accepted_at, version")
    .eq("user_id", user.id)
    .eq("accepted", true)
    .order("accepted_at");

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <PageHeader title="Configurações ⚙️" />

      <Card>
        <SectionTitle title="Preferências" />
        <div className="space-y-2.5">
          <NotificationToggle />
          <DarkModeToggle />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Privacidade e dados (LGPD)" subtitle="Você controla seus dados." />
        <div className="space-y-2.5">
          <ExportDataButton />
          <DeletePhotosExamsButton />
          <DeleteAccountButton />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">Consentimentos ativos</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft dark:text-slate-400">
            {(consents ?? []).map((c) => (
              <li key={c.consent_type} className="flex justify-between">
                <span>✓ {consentLabels[c.consent_type] ?? c.consent_type}</span>
                <span className="text-xs text-ink-mute">v{c.version} · {formatDate(c.accepted_at)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-mute">
            Detalhes em{" "}
            <Link href="/privacidade" className="text-tech-600 underline">Política de Privacidade</Link>{" "}
            e{" "}
            <Link href="/termos" className="text-tech-600 underline">Termos de uso</Link>.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Conta" />
        <p className="mb-3 text-sm text-ink-soft">Logado como <b>{user.email}</b></p>
        <LogoutButton />
      </Card>
    </div>
  );
}
