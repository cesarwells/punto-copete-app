"use server";
import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { isValidRut, normalizeRut } from "@/lib/rut";
import { rateLimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";

export type FormState = { error?: string };

const COOKIE = "pc_otp";
const hash = (otpId: string, code: string) => createHash("sha256").update(`${otpId}:${code}`).digest("hex");

export async function requestCode(_: FormState, form: FormData): Promise<FormState> {
  const rut = normalizeRut(String(form.get("rut") ?? ""));
  if (!isValidRut(rut)) return { error: "El RUT no es válido." };
  if (!(await rateLimit("otp", 5, 900)) || !(await rateLimit("otp-rut", 3, 900, rut))) {
    return { error: "Demasiados intentos. Espera 15 minutos y vuelve a probar." };
  }

  const db = adminClient();
  const { data: customer } = await db.from("customers").select("id, name, email").eq("rut", rut).maybeSingle();

  // Si el RUT no existe se sigue igual, para no revelar quién está inscrito.
  let otpId: string = randomUUID();
  if (customer) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { data: otp, error } = await db
      .from("otp_codes")
      .insert({ customer_id: customer.id, code_hash: "pendiente" })
      .select("id")
      .single();
    if (error) return { error: "No pudimos generar el código. Inténtalo de nuevo." };
    otpId = otp.id;
    await db.from("otp_codes").update({ code_hash: hash(otpId, code) }).eq("id", otpId);
    await sendEmail(
      customer.email,
      `Tu código es ${code}`,
      `<p>Hola ${customer.name},</p><p>Tu código para entrar a tu cuenta de Punto Copete es:</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p>
       <p>Vence en 10 minutos. Si no lo pediste, ignora este correo.</p>`,
    );
  }

  (await cookies()).set(COOKIE, otpId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/ingresar" });
  redirect("/ingresar/codigo");
}

export async function verifyCode(_: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  const jar = await cookies();
  const otpId = jar.get(COOKIE)?.value;
  if (!otpId) return { error: "El código venció. Vuelve a pedir uno." };
  if (!(await rateLimit("otp-verify", 20, 900))) return { error: "Demasiados intentos. Espera 15 minutos." };

  const db = adminClient();
  const { data: otp } = await db
    .from("otp_codes")
    .select("id, customer_id, code_hash, expires_at, attempts, used_at")
    .eq("id", otpId)
    .maybeSingle();

  if (!otp || otp.used_at || new Date(otp.expires_at) < new Date() || otp.attempts >= 5) {
    return { error: "El código venció o se usó demasiadas veces. Vuelve a pedir uno." };
  }
  await db.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);

  const expected = Buffer.from(otp.code_hash);
  const given = Buffer.from(hash(otp.id, code));
  if (code.length !== 6 || expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { error: `Código incorrecto. Te quedan ${Math.max(0, 4 - otp.attempts)} intentos.` };
  }

  await db.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", otp.id);
  const { data: customer } = await db.from("customers").select("portal_token").eq("id", otp.customer_id).single();
  jar.delete({ name: COOKIE, path: "/ingresar" });
  redirect(`/mi-cuenta/${customer!.portal_token}`);
}
