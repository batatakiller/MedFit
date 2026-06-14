"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validators";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({ name, email, password, accepted });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/consentimento`,
      },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este e-mail já possui conta. Faça login."
          : "Não foi possível criar a conta. Verifique os dados."
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl">📬</p>
        <h2 className="font-bold">Confirme seu e-mail</h2>
        <p className="text-sm text-ink-soft">
          Enviamos um link de confirmação para <b>{email}</b>. Abra-o para ativar sua conta e
          iniciar o onboarding.
        </p>
        <Link href="/login" className="btn-secondary w-full">Ir para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Nome</label>
        <input id="name" required className="input" value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required className="input" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input id="password" type="password" required minLength={8} className="input" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-600" checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)} />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-medium text-tech-600 hover:underline">Termos de uso</Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-tech-600 hover:underline">Política de privacidade</Link>.
        </span>
      </label>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Criando conta..." : "Criar conta gratuita"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
