// Edge Function `embed` — gera embeddings (gte-small, 384 dims) para o RAG
// do paciente usando o runtime de IA nativo do Supabase. A service role key
// fica apenas aqui (backend); o frontend nunca a vê.
//
// Deploy: supabase functions deploy embed
// Chamada: POST { texts: string[] }  →  { embeddings: number[][] }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const session = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 });
  }
  try {
    const { texts } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 50) {
      return new Response(JSON.stringify({ error: "texts deve ser array de 1 a 50 strings" }), { status: 400 });
    }
    const embeddings: number[][] = [];
    for (const t of texts) {
      const v = (await session.run(String(t).slice(0, 4000), {
        mean_pool: true,
        normalize: true,
      })) as number[];
      embeddings.push(Array.from(v));
    }
    return new Response(JSON.stringify({ embeddings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // não logar conteúdo (pode conter dados clínicos) — apenas o tipo do erro
    console.error("embed error:", e?.constructor?.name);
    return new Response(JSON.stringify({ error: "embedding failed" }), { status: 500 });
  }
});
