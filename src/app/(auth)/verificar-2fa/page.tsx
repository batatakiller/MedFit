import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

export const metadata = { title: "Verificação em duas etapas" };

export default function Verificar2faPage() {
  return (
    <AuthShell
      title="Verificação em duas etapas"
      subtitle="Sua conta está protegida com 2FA. Confirme sua identidade para continuar."
    >
      <Suspense>
        <TwoFactorChallengeForm />
      </Suspense>
    </AuthShell>
  );
}
