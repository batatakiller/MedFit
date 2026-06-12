import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Redefinir senha" };
export const dynamic = "force-dynamic";

export default function RedefinirSenhaPage() {
  return (
    <AuthShell title="Defina sua nova senha" subtitle="Você chegou aqui pelo link enviado ao seu e-mail.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
