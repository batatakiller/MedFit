import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com SERVICE ROLE — ignora RLS. USO EXCLUSIVO no servidor
// (API routes / jobs). O import de "server-only" quebra o build se este
// módulo vazar para o bundle do navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
