import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Confirmação de e-mail" };

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ok = status !== "erro";
  return (
    <AuthShell title={ok ? "E-mail confirmado! 🎉" : "Link inválido ou expirado"}>
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink-soft">
          {ok
            ? "Sua conta está ativa. Entre para fazer o consentimento LGPD e o onboarding."
            : "Solicite um novo link de confirmação fazendo login — reenviaremos automaticamente."}
        </p>
        <Link href="/login" className="btn-primary w-full">Ir para o login</Link>
      </div>
    </AuthShell>
  );
}
