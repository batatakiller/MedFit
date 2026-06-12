"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, FileText, HeartPulse, Pill, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NOT_MEDICAL_ADVICE } from "@/lib/utils";

const CONSENT_VERSION = "1.0";

const consents = [
  {
    type: "dados_sensiveis",
    required: true,
    icon: HeartPulse,
    title: "Dados sensíveis de saúde",
    desc: "Autorizo o tratamento dos meus dados de saúde (condições clínicas, medidas, check-ins) para que a equipe de IA gere orientações educacionais personalizadas.",
  },
  {
    type: "exames",
    required: false,
    icon: FileText,
    title: "Armazenamento de exames",
    desc: "Autorizo o armazenamento dos meus exames (PDF/imagem) em área privada e a extração de texto (OCR) para apoiar as análises.",
  },
  {
    type: "fotos_corporais",
    required: false,
    icon: Camera,
    title: "Análise corporal por fotos",
    desc: "Autorizo o envio de fotos corporais para área privada e a análise por IA (estimativas de medidas, composição e postura, com margem de erro declarada).",
  },
  {
    type: "lembretes_medicamentos",
    required: false,
    icon: Pill,
    title: "Lembretes de medicamentos cadastrados",
    desc: "Autorizo lembretes dos horários de medicamentos que EU cadastrar. O Med Fit não prescreve, altera ou suspende medicamentos.",
  },
] as const;

export function ConsentForm({ alreadyAccepted }: { alreadyAccepted: string[] }) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(consents.map((c) => [c.type, alreadyAccepted.includes(c.type)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!checked["dados_sensiveis"]) {
      setError("O consentimento de dados sensíveis é necessário para usar o Med Fit.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");

    const rows = consents
      .filter((c) => checked[c.type] && !alreadyAccepted.includes(c.type))
      .map((c) => ({
        user_id: user.id,
        consent_type: c.type,
        accepted: true,
        version: CONSENT_VERSION,
      }));
    // termos+privacidade são aceitos no cadastro; registra aqui para auditoria
    for (const t of ["termos_uso", "privacidade"]) {
      if (!alreadyAccepted.includes(t)) {
        rows.push({ user_id: user.id, consent_type: t as never, accepted: true, version: CONSENT_VERSION });
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("consents").insert(rows);
      if (error && error.code !== "23505") {
        setSaving(false);
        setError("Não foi possível salvar. Tente novamente.");
        return;
      }
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-tech-200 bg-tech-50 p-4 text-sm text-tech-900 dark:border-tech-900 dark:bg-tech-950/40 dark:text-tech-200">
        <div className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-5 w-5" /> Aviso importante (leia antes de continuar)
        </div>
        <p className="mt-2">{NOT_MEDICAL_ADVICE}</p>
        <p className="mt-2">
          Em situações de risco — dor no peito, tontura, falta de ar, dor aguda — interrompa
          qualquer atividade e procure atendimento médico imediatamente.
        </p>
      </div>

      <div className="space-y-3">
        {consents.map((c) => (
          <label
            key={c.type}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
              checked[c.type]
                ? "border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand-600"
              checked={checked[c.type] ?? false}
              disabled={alreadyAccepted.includes(c.type)}
              onChange={(e) => setChecked((s) => ({ ...s, [c.type]: e.target.checked }))}
            />
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <c.icon className="h-4 w-4 text-brand-600" />
                {c.title}
                {c.required && <span className="chip bg-rose-100 text-rose-700">obrigatório</span>}
              </p>
              <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">{c.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <p className="text-xs text-ink-mute">
        Detalhes do tratamento de dados na{" "}
        <Link href="/privacidade" target="_blank" className="text-tech-600 underline">Política de Privacidade</Link>{" "}
        (LGPD). Você pode revogar consentimentos e solicitar exclusão de dados em Configurações.
      </p>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button onClick={save} disabled={saving} className="btn-gradient w-full">
        {saving ? "Salvando..." : "Confirmar e continuar"}
      </button>
    </div>
  );
}
