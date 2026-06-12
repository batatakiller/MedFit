import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { BodyPhotoUpload } from "@/components/photos/BodyPhotoUpload";

export const metadata = { title: "Fotos corporais" };
export const dynamic = "force-dynamic";

export default async function FotosPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: consent }, { data: health }] = await Promise.all([
    supabase.from("consents").select("id").eq("user_id", user.id).eq("consent_type", "fotos_corporais").eq("accepted", true).limit(1).maybeSingle(),
    supabase.from("health_records").select("weight").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader
        title="Enviar fotos corporais 📸"
        subtitle="Frente é obrigatória; perfis e costas melhoram a precisão."
        action={<Link href="/guia-fotos" className="text-sm font-semibold text-tech-600 hover:underline">Ver guia de fotos →</Link>}
      />
      <BodyPhotoUpload
        weightKg={health?.weight ? Number(health.weight) : null}
        hasConsent={Boolean(consent)}
      />
    </div>
  );
}
