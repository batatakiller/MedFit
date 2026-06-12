import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Retorna o usuário autenticado (validado no servidor) ou null.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Exige autenticação em Server Components / Route Handlers.
// Redireciona para /login quando não há sessão válida.
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Variante para API routes: lança 401 em vez de redirecionar.
export async function requireAuthApi() {
  const user = await getCurrentUser();
  if (!user) {
    throw Object.assign(new Error("não autenticado"), { status: 401 });
  }
  return user;
}
