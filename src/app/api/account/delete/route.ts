import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/account/delete — exclusão definitiva da conta (LGPD).
// Com SUPABASE_SERVICE_ROLE_KEY configurada: remove arquivos dos buckets e o
// usuário do Auth (as tabelas caem em cascata via FK em auth.users).
// Sem a chave: registra a solicitação para processamento manual pelo backend.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const admin = createAdminClient();

  if (!admin) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "sistema",
      title: "Solicitação de exclusão de conta",
      message: "Usuário solicitou exclusão definitiva (LGPD). Processar via backend.",
      status: "pendente",
    });
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true, mode: "solicitacao_registrada" });
  }

  try {
    // arquivos primeiro (não caem em cascata)
    for (const bucket of ["exams", "body-photos", "avatars"]) {
      const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
      if (files?.length) {
        await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      }
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, mode: "excluida" });
  } catch (e) {
    console.error("account delete error:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "falha ao excluir conta" }, { status: 500 });
  }
}
