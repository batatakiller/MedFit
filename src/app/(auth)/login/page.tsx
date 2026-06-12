import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre para acompanhar seu plano de hoje.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
