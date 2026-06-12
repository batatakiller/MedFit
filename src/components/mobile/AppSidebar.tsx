"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple, Calendar, Camera, ClipboardList, CreditCard, Dumbbell, FileText, HeartPulse,
  History, Home, LayoutDashboard, LogOut, Pill, Settings, Sparkles, TrendingUp, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const groups: { title: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    title: "Visão geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/hoje", label: "Hoje", icon: Home },
      { href: "/plano", label: "Plano integrado", icon: Sparkles },
    ],
  },
  {
    title: "Dia a dia",
    items: [
      { href: "/treino", label: "Treino do dia", icon: Dumbbell },
      { href: "/dieta", label: "Dieta do dia", icon: Apple },
      { href: "/medicacoes", label: "Medicações", icon: Pill },
      { href: "/checkin", label: "Check-in rápido", icon: ClipboardList },
    ],
  },
  {
    title: "Evolução",
    items: [
      { href: "/evolucao", label: "Evolução", icon: TrendingUp },
      { href: "/fotos", label: "Fotos corporais", icon: Camera },
      { href: "/scans", label: "Body scans", icon: History },
      { href: "/comparativo", label: "Comparativo visual", icon: Calendar },
      { href: "/historico", label: "Avaliações", icon: FileText },
    ],
  },
  {
    title: "Conta",
    items: [
      { href: "/exames", label: "Exames", icon: FileText },
      { href: "/perfil", label: "Perfil", icon: User },
      { href: "/assinatura", label: "Assinatura", icon: CreditCard },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-950">
      <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
          <HeartPulse className="h-5 w-5" />
        </span>
        Med <span className="text-brand-600">Fit</span>
      </Link>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink-mute">{g.title}</p>
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-ink-soft hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <button
        onClick={logout}
        className="mx-3 mb-5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sair
      </button>
    </aside>
  );
}
