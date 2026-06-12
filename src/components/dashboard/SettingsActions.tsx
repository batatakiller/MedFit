"use client";

// Ações de Configurações: dados (LGPD), notificações, modo escuro, logout.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Download, LogOut, Moon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { enablePushNotifications } from "@/lib/notifications";

export function NotificationToggle() {
  const [status, setStatus] = useState<string>("");
  async function enable() {
    const r = await enablePushNotifications();
    setStatus(
      r === "ok" ? "Notificações ativadas ✓"
        : r === "denied" ? "Permissão negada no navegador."
        : "Este navegador não suporta notificações."
    );
  }
  return (
    <div>
      <button onClick={enable} className="btn-secondary w-full justify-start">
        <Bell className="h-4 w-4 text-tech-600" /> Ativar lembretes e notificações push
      </button>
      {status && <p className="mt-1.5 text-xs text-ink-soft">{status}</p>}
    </div>
  );
}

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("medfit-dark") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("medfit-dark", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  }
  return (
    <button onClick={toggle} className="btn-secondary w-full justify-start">
      <Moon className="h-4 w-4 text-slate-500" /> Modo escuro: {dark ? "ativado" : "desativado"}
    </button>
  );
}

export function ExportDataButton() {
  const [busy, setBusy] = useState(false);
  async function exportData() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const tables = [
      "profiles", "health_records", "body_measurements", "medications", "medication_schedules",
      "medication_logs", "exams", "diet_logs", "training_routines", "goals", "ai_assessments",
      "meal_plans", "workout_plans", "monthly_checkins", "daily_checkins", "water_logs",
      "body_scan_sessions", "body_scan_measurements", "consents",
    ];
    const dump: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id };
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*").eq("user_id", user.id);
      dump[t] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `medfit-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(false);
  }
  return (
    <button onClick={exportData} disabled={busy} className="btn-secondary w-full justify-start">
      <Download className="h-4 w-4 text-brand-600" /> {busy ? "Exportando..." : "Visualizar/exportar meus dados (JSON)"}
    </button>
  );
}

export function DeletePhotosExamsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!confirm("Excluir TODOS os seus exames e fotos corporais? Esta ação é definitiva.")) return;
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: exams } = await supabase.from("exams").select("file_url").eq("user_id", user.id);
    if (exams?.length) await supabase.storage.from("exams").remove(exams.map((e) => e.file_url));
    const { data: photos } = await supabase.from("body_scan_photos").select("file_url").eq("user_id", user.id);
    if (photos?.length) await supabase.storage.from("body-photos").remove(photos.map((p) => p.file_url));
    await supabase.from("exams").delete().eq("user_id", user.id);
    await supabase.from("body_scan_sessions").delete().eq("user_id", user.id); // cascata: fotos/medidas/relatórios
    setBusy(false);
    alert("Exames e fotos excluídos.");
    router.refresh();
  }
  return (
    <button onClick={run} disabled={busy} className="btn-secondary w-full justify-start text-amber-700">
      <Trash2 className="h-4 w-4" /> {busy ? "Excluindo..." : "Excluir meus exames e fotos corporais"}
    </button>
  );
}

export function DeleteAccountButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run() {
    const phrase = prompt(
      'Excluir a conta remove TODOS os seus dados (perfil, saúde, planos, fotos, exames) definitivamente.\n\nDigite "EXCLUIR" para confirmar:'
    );
    if (phrase !== "EXCLUIR") return;
    setBusy(true);
    const res = await fetch("/api/account/delete", { method: "POST" }).catch(() => null);
    const json = await res?.json().catch(() => null);
    await createClient().auth.signOut();
    setBusy(false);
    router.push(json?.mode === "excluida" ? "/?conta=excluida" : "/?conta=exclusao-solicitada");
  }
  return (
    <button onClick={run} disabled={busy} className="btn-secondary w-full justify-start text-rose-600">
      <Trash2 className="h-4 w-4" /> {busy ? "Processando..." : "Solicitar exclusão da conta (LGPD)"}
    </button>
  );
}

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn-secondary w-full justify-start">
      <LogOut className="h-4 w-4" /> Sair da conta
    </button>
  );
}
