"use server";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { isValidRut, normalizeRut } from "@/lib/rut";
import { errorMessage } from "@/lib/format";
import { rateLimit } from "@/lib/ratelimit";

export type FormState = { error?: string; values?: Record<string, string> };

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const fail = (error: string): FormState => ({
    error,
    values: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])),
  });
  const rut = normalizeRut(String(form.get("rut") ?? ""));
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const birth = String(form.get("birth_date") ?? "") || null;

  if (!isValidRut(rut)) return fail("El RUT no es válido. Revisa el dígito verificador.");
  if (name.length < 2) return fail("Escribe tu nombre.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("El correo no es válido.");
  if (phone.replace(/\D/g, "").length < 8) return fail("Escribe un teléfono válido.");
  if (form.get("terms") !== "on") return fail("Debes aceptar los términos para inscribirte.");
  if (!(await rateLimit("inscripcion", 10, 3600))) {
    return fail("Demasiados intentos. Prueba de nuevo en un rato.");
  }

  const { data, error } = await adminClient().rpc("register_customer", {
    p_rut: rut,
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_birth_date: birth,
    p_marketing_opt_in: form.get("marketing") === "on",
  });
  if (error) return fail(errorMessage(error));
  redirect(`/mi-cuenta/${data.portal_token}?bienvenida=1`);
}
