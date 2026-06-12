import { requireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/mobile/AppSidebar";
import { BottomMobileNavigation } from "@/components/mobile/BottomMobileNavigation";

export const dynamic = "force-dynamic";

// Layout das rotas PRIVADAS — requireAuth() redireciona para /login sem sessão
// (defesa em profundidade junto com o middleware).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <AppSidebar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:pb-10 lg:pl-72 lg:pr-8 lg:max-w-none xl:max-w-[1400px]">
        {children}
      </main>
      <BottomMobileNavigation />
    </div>
  );
}
