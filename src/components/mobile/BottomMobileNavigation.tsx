"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Dumbbell, Home, MessageCircle, Pill, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/hoje", label: "Hoje", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/dieta", label: "Dieta", icon: Apple },
  { href: "/medicacoes", label: "Medicações", icon: Pill },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomMobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto grid max-w-lg grid-cols-7">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition",
                active ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
