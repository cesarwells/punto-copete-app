import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave service_role: solo se usa en el servidor, después
// de verificar quién está haciendo la operación.
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
