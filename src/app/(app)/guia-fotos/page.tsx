import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { BodyPhotoGuide } from "@/components/photos/BodyPhotoGuide";
import { requireAuth } from "@/lib/auth";

export const metadata = { title: "Guia de fotos corporais" };
export const dynamic = "force-dynamic";

export default async function GuiaFotosPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <PageHeader title="Guia de fotos corporais" subtitle="Padronização = análises comparáveis mês a mês." />
      <BodyPhotoGuide />
      <Link href="/fotos" className="btn-gradient w-full">Estou pronto — enviar fotos</Link>
    </div>
  );
}
