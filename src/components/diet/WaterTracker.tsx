"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ui";
import { todayISO } from "@/lib/utils";

export function WaterTracker({ consumedMl, goalMl }: { consumedMl: number; goalMl: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(consumedMl);

  async function add(amount: number) {
    setBusy(true);
    setLocal((v) => v + amount); // otimista
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("water_logs").insert({ user_id: user.id, date: todayISO(), amount_ml: amount });
    }
    setBusy(false);
    router.refresh();
  }

  const pct = goalMl ? (local / goalMl) * 100 : 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold">
          <Droplets className="h-5 w-5 text-sky-500" /> Água
        </p>
        <p className="text-sm font-bold text-sky-600">
          {(local / 1000).toFixed(1).replace(".", ",")}L
          <span className="font-medium text-ink-mute"> / {(goalMl / 1000).toFixed(1).replace(".", ",")}L</span>
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar value={pct} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[200, 300, 500].map((ml) => (
          <button key={ml} onClick={() => add(ml)} disabled={busy}
            className="flex items-center justify-center gap-1 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-100 active:scale-95 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
            <Plus className="h-3.5 w-3.5" /> {ml}ml
          </button>
        ))}
      </div>
      {pct >= 100 && <p className="mt-2 text-center text-sm font-semibold text-brand-600">Meta de água batida! 💧</p>}
    </div>
  );
}
