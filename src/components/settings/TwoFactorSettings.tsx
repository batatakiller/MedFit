"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TotpFactor {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
}

interface EnrollData {
  factorId: string;
  qrCode: string; // data URI (SVG) pronto para <img src>
  secret: string;
}

// Ativação/desativação de 2FA (TOTP) via Supabase MFA.
// Fluxo: enroll → QR code no app autenticador → verify (código) → AAL2.
export function TwoFactorSettings() {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as TotpFactor[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = factors.find((f) => f.status === "verified") ?? null;

  async function startEnroll() {
    setError(null);
    setBusy(true);
    const supabase = createClient();

    // remove fatores não verificados de tentativas abandonadas (evita conflito de nome)
    for (const f of factors.filter((f) => f.status === "unverified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Med Fit",
    });
    setBusy(false);
    if (error || !data) {
      setError("Não foi possível iniciar a ativação do 2FA. Tente novamente.");
      return;
    }
    setEnroll({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: enroll.factorId,
    });
    if (cErr || !challenge) {
      setBusy(false);
      setError("Falha ao iniciar verificação. Tente novamente.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError("Código inválido. Confira o app autenticador e tente de novo.");
      return;
    }
    setEnroll(null);
    setCode("");
    await refresh();
  }

  async function disable() {
    if (!active) return;
    if (!confirm("Desativar a verificação em duas etapas? Sua conta ficará menos protegida.")) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: active.id });
    setBusy(false);
    if (error) {
      setError("Não foi possível desativar. Saia e entre novamente, depois tente de novo.");
      return;
    }
    await refresh();
  }

  if (!loaded) {
    return <p className="text-sm text-ink-mute">Carregando…</p>;
  }

  // ── 2FA ativo ──────────────────────────────────────────────────────────
  if (active) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 dark:bg-brand-950/30">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-sm font-bold text-brand-800 dark:text-brand-200">2FA ativado</p>
            <p className="text-xs text-brand-700 dark:text-brand-300">
              Um código do app autenticador é exigido a cada login.
            </p>
          </div>
        </div>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button onClick={disable} disabled={busy} className="btn-secondary text-sm">
          <ShieldOff className="mr-1.5 inline h-4 w-4" />
          {busy ? "Desativando..." : "Desativar 2FA"}
        </button>
      </div>
    );
  }

  // ── Enrolamento em andamento (QR + código) ─────────────────────────────
  if (enroll) {
    return (
      <form onSubmit={confirmEnroll} className="space-y-3">
        <p className="text-sm text-ink-soft dark:text-slate-300">
          1. Escaneie o QR code com seu app autenticador (Google Authenticator, 1Password, Authy…):
        </p>
        <div className="flex justify-center rounded-xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qrCode} alt="QR code para configurar 2FA" className="h-44 w-44" />
        </div>
        <p className="break-all rounded-lg bg-slate-50 p-2 text-center text-xs text-ink-mute dark:bg-slate-800/60">
          Sem câmera? Insira manualmente: <b>{enroll.secret}</b>
        </p>
        <div>
          <label className="label" htmlFor="enroll-code">2. Digite o código de 6 dígitos gerado</label>
          <input
            id="enroll-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="input text-center text-xl tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </div>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy || code.length !== 6} className="btn-primary flex-1">
            {busy ? "Confirmando..." : "Confirmar e ativar"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEnroll(null);
              setCode("");
              setError(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  // ── 2FA inativo ────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft dark:text-slate-300">
        Adicione uma camada extra de proteção: além da senha, um código temporário do seu app
        autenticador será exigido no login. Recomendado para proteger seus dados de saúde.
      </p>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button onClick={startEnroll} disabled={busy} className="btn-primary text-sm">
        <ShieldCheck className="mr-1.5 inline h-4 w-4" />
        {busy ? "Preparando..." : "Ativar verificação em duas etapas"}
      </button>
    </div>
  );
}
