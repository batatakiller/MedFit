import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
