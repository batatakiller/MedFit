// Edge Function `reminders` — agendada via cron (Supabase Scheduled Functions).
// Cria linhas em `notifications` para horários de medicamentos cadastrados,
// água, refeições e check-in mensal. Estrutura pronta para envio Web Push
// (VAPID) quando as chaves forem configuradas.
//
// Cron sugerido (a cada 15min): supabase functions deploy reminders
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role: apenas backend
  );

  const now = new Date();
  const windowStart = now.toTimeString().slice(0, 5);
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000).toTimeString().slice(0, 5);
  const dow = now.getDay();

  // Medicamentos com horário dentro da janela de 15min
  const { data: schedules, error } = await supabase
    .from("medication_schedules")
    .select("id, user_id, scheduled_time, days_of_week, medications(name)")
    .eq("active", true)
    .gte("scheduled_time", windowStart)
    .lt("scheduled_time", windowEnd);

  if (error) {
    console.error("reminders query error:", error.code);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  let created = 0;
  for (const s of schedules ?? []) {
    if (!s.days_of_week?.includes(dow)) continue;
    const medName = (s as { medications?: { name?: string } }).medications?.name ?? "medicamento";
    const { error: insErr } = await supabase.from("notifications").insert({
      user_id: s.user_id,
      type: "medicamento",
      title: "Hora do medicamento cadastrado",
      message: `Você registrou ${medName} para este horário. Siga sempre a orientação do seu médico.`,
      scheduled_for: now.toISOString(),
      status: "pendente",
    });
    if (!insErr) created++;
    // TODO push: buscar push_subscriptions do usuário e enviar via Web Push (VAPID)
  }

  return new Response(JSON.stringify({ ok: true, created }), {
    headers: { "Content-Type": "application/json" },
  });
});
