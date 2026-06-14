import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionTitle } from "@/components/ui";
import { ExamUpload } from "@/components/exams/ExamUpload";
import { ExamList } from "@/components/exams/ExamList";

export const metadata = { title: "Exames" };
export const dynamic = "force-dynamic";

export default async function ExamesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: exams }, { data: consent }] = await Promise.all([
    supabase.from("exams").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false }),
    supabase.from("consents").select("id").eq("user_id", user.id).eq("consent_type", "exames").eq("accepted", true).limit(1).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <PageHeader
        title="Exames 🧪"
        subtitle="Envie um ou mais exames em PDF ou imagem. O texto extraído ajuda a IA a cruzar marcadores como hormônios, vitaminas e exames laboratoriais."
      />
      <ExamUpload hasConsent={Boolean(consent)} />
      <section>
        <SectionTitle title="Meus exames" subtitle="Arquivos em bucket privado, acessados por URL assinada temporária" />
        <ExamList exams={exams ?? []} />
      </section>
      <p className="text-xs text-ink-mute">
        Exames alterados devem sempre ser avaliados por médico habilitado. A IA usa os dados apenas
        como apoio educacional.
      </p>
    </div>
  );
}
