"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credenciais" | "totp">("credenciais");

  function goToApp() {
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : error.message.includes("not confirmed")
            ? "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada)."
            : "Não foi possível entrar. Tente novamente."
      );
      return;
    }

    // Conta com 2FA ativo: senha autentica em AAL1; pedir TOTP para elevar a AAL2.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setLoading(false);
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
      setStep("totp");
      return;
    }
    goToApp();
  }

  if (step === "totp") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-tech-50 p-3 text-sm text-tech-800 dark:bg-tech-950/40 dark:text-tech-200">
          🔐 Esta conta tem verificação em duas etapas ativada.
        </p>
        <TwoFactorChallengeForm onSuccess={goToApp} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required autoComplete="email" className="input"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input id="password" type="password" required autoComplete="current-password" className="input"
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/recuperar-senha" className="font-medium text-tech-600 hover:underline">Esqueci minha senha</Link>
        <Link href="/cadastro" className="font-medium text-brand-600 hover:underline">Criar conta</Link>
      </div>
    </form>
  );
}
