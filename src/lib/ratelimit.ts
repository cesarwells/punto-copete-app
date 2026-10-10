import "server-only";
import { headers } from "next/headers";
import { adminClient } from "./supabase/admin";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "desconocida";
}

// true si la acción está permitida.
export async function rateLimit(action: string, max: number, windowSeconds: number, extraKey = "") {
  const key = `${action}:${await clientIp()}${extraKey ? `:${extraKey}` : ""}`;
  const { data, error } = await adminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data as boolean;
}
