"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  status: string;
  created_at: string;
  read_at: string | null;
}

const typeEmoji: Record<string, string> = {
  treino: "🏋️", refeicao: "🍽️", agua: "💧", medicamento: "💊",
  checkin_mensal: "📅", alerta: "⚠️", sistema: "⚙️",
};

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    await createClient()
      .from("notifications")
      .update({ status: "lida", read_at: new Date().toISOString() })
      .eq("id", id);
    router.refresh();
  }

  async function markAllRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ status: "lida", read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .neq("status", "lida");
    router.refresh();
  }

  const unread = notifications.filter((n) => n.status !== "lida");

  if (!notifications.length) {
    return (
      <div className="card p-8 text-center">
        <Bell className="mx-auto h-8 w-8 text-ink-mute" />
        <p className="mt-2 font-semibold">Nenhuma notificação</p>
        <p className="mt-1 text-sm text-ink-soft">
          Lembretes de treino, refeições, água, medicamentos cadastrados e check-ins aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <button onClick={markAllRead} className="btn-secondary w-full text-sm">
          <CheckCheck className="h-4 w-4" /> Marcar todas como lidas ({unread.length})
        </button>
      )}
      {notifications.map((n) => {
        const isUnread = n.status !== "lida";
        return (
          <div key={n.id}
            className={`card flex items-start gap-3 p-4 ${isUnread ? "border-tech-200 bg-tech-50/50 dark:border-tech-900 dark:bg-tech-950/20" : "opacity-75"}`}>
            <span className="text-xl">{typeEmoji[n.type] ?? "🔔"}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${isUnread ? "font-bold" : "font-medium"}`}>{n.title}</p>
              {n.message && <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">{n.message}</p>}
              <p className="mt-1 text-xs text-ink-mute">{formatDate(n.created_at)}</p>
            </div>
            {isUnread && (
              <button onClick={() => markRead(n.id)} title="Marcar como lida"
                className="shrink-0 rounded-lg p-2 text-tech-600 transition hover:bg-tech-100">
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Card compacto para a tela “Hoje”
export function UnreadNotificationsCard({ count }: { count: number }) {
  if (!count) return null;
  return (
    <a href="/notificacoes"
      className="card flex items-center justify-between gap-3 border-tech-200 bg-tech-50/70 p-4 transition active:scale-[0.99] dark:border-tech-900 dark:bg-tech-950/30">
      <span className="flex items-center gap-2 font-bold text-tech-800 dark:text-tech-300">
        <BellRing className="h-5 w-5" /> {count} {count === 1 ? "alerta novo" : "alertas novos"}
      </span>
      <span className="text-sm font-semibold text-tech-600">Ver →</span>
    </a>
  );
}
