"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tela alcançada pelo link de recuperação (auth/callback?next=/redefinir-senha).
export function ResetPasswordForm() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSaving(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (err) {
      setError(
        err.message.includes("different from the old")
          ? "A nova senha precisa ser diferente da anterior."
          : "Não foi possível redefinir a senha. Abra o link do e-mail novamente."
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (hasSession === null) {
    return <p className="text-center text-sm text-ink-soft">Verificando link…</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl">⏱️</p>
        <p className="text-sm text-ink-soft">
          O link de recuperação expirou ou já foi usado. Solicite um novo para continuar.
        </p>
        <Link href="/recuperar-senha" className="btn-primary w-full">Solicitar novo link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">Nova senha</label>
        <input id="password" type="password" required minLength={8} className="input"
          autoComplete="new-password" placeholder="Mínimo 8 caracteres"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirmar nova senha</label>
        <input id="confirm" type="password" required className="input"
          autoComplete="new-password" placeholder="Repita a senha"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
