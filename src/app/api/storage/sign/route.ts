import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  bucket: z.enum(["exams", "body-photos", "avatars"]),
  path: z.string().min(3).max(500),
});

// POST /api/storage/sign — gera URL assinada temporária (10min) para um
// arquivo do PRÓPRIO usuário em bucket privado. As policies de storage já
// impedem acesso cruzado; aqui validamos também o prefixo da pasta.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "dados inválidos" }, { status: 400 });

  const { bucket, path } = parsed.data;
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "acesso negado" }, { status: 403 });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
  if (error || !data) {
    return NextResponse.json({ error: "falha ao assinar URL" }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
