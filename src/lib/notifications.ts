"use client";

import { createClient } from "@/lib/supabase/client";

// Estrutura de notificações push (Web Push / VAPID).
// Lembretes: treino, refeição, água, medicamentos cadastrados, check-in mensal.

export async function enablePushNotifications(): Promise<"ok" | "denied" | "unsupported"> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return "ok"; // permissão dada; assinatura ativa quando houver VAPID

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid),
  });

  const json = sub.toJSON();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && json.endpoint && json.keys) {
    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" }
    );
  }
  return "ok";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
