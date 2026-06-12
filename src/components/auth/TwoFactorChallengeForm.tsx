"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Desafio TOTP: eleva a sessão de AAL1 para AAL2 com o código do app
// autenticador. Usado na página /verificar-2fa e na etapa 2 do login.
export function TwoFactorChallengeForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === "verified") ?? factors?.totp?.[0];
    if (fErr || !totp) {
      setLoading(false);
      setError("Nenhum fator 2FA encontrado nesta conta.");
      return;
    }

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    });
    if (cErr || !challenge) {
      setLoading(false);
      setError("Não foi possível iniciar a verificação. Tente novamente.");
      return;
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setLoading(false);
    if (vErr) {
      setError("Código inválido ou expirado. Confira o app autenticador.");
      return;
    }

    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  async function cancel() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="totp-code">Código de verificação</label>
        <input
          id="totp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className="input text-center text-2xl tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        <p className="mt-1.5 text-xs text-ink-mute">
          Abra seu app autenticador (Google Authenticator, 1Password, Authy…) e digite o código de 6 dígitos.
        </p>
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
        {loading ? "Verificando..." : "Verificar"}
      </button>
      <button type="button" onClick={cancel} className="w-full text-center text-sm font-medium text-ink-mute hover:underline">
        Sair e voltar ao login
      </button>
    </form>
  );
}
