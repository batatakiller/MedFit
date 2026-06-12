import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthShell title="Crie sua conta" subtitle="Comece grátis — sua equipe de IA te espera.">
      <RegisterForm />
    </AuthShell>
  );
}
