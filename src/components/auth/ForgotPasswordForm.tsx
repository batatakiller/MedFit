"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setLoading(false);
    setSent(true); // resposta neutra (não revela se o e-mail existe)
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl">🔐</p>
        <p className="text-sm text-ink-soft">
          Se houver uma conta para <b>{email}</b>, você receberá um link para redefinir a senha.
        </p>
        <Link href="/login" className="btn-secondary w-full">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">E-mail da conta</label>
        <input id="email" type="email" required className="input" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Enviando..." : "Enviar link de recuperação"}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-tech-600 hover:underline">Voltar ao login</Link>
      </p>
    </form>
  );
}
