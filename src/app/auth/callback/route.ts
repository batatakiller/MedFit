import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de autenticação: troca o código (confirmação de e-mail,
// recuperação de senha, magic link) por sessão e redireciona.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/dashboard"}`);
    }
  }
  return NextResponse.redirect(`${origin}/confirmar-email?status=erro`);
}
