"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sessionClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/staff";
import { errorMessage } from "@/lib/format";
import { rateLimit } from "@/lib/ratelimit";

export type FormState = { error?: string; email?: string };

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 900))) return { error: "Demasiados intentos. Espera 15 minutos." };
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Correo o contraseña incorrectos.", email: String(form.get("email") ?? "") };
  redirect("/caja");
}

export async function logout() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/caja/login");
}

function done(code: string, msg: string): never {
  revalidatePath(`/caja/c/${code}`);
  redirect(`/caja/c/${code}?ok=${encodeURIComponent(msg)}`);
}

export async function earn(customerId: string, code: string, _: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const amount = Number(String(form.get("amount") ?? "").replace(/\D/g, ""));
  const { data, error } = await adminClient().rpc("earn_points", {
    p_customer_id: customerId,
    p_amount_clp: amount,
    p_receipt_number: String(form.get("receipt") ?? ""),
    p_staff_user_id: staff.id,
  });
  if (error) return { error: errorMessage(error) };
  const r = data[0];
  done(code, `+${r.points} puntos · Saldo: ${r.balance}`);
}

export async function redeem(customerId: string, code: string, rewardId: string): Promise<FormState> {
  const staff = await requireStaff();
  const { data, error } = await adminClient().rpc("redeem_reward", {
    p_customer_id: customerId,
    p_reward_id: rewardId,
    p_staff_user_id: staff.id,
  });
  if (error) return { error: errorMessage(error) };
  const r = data[0];
  done(code, `Canje listo: ${r.points} puntos · Saldo: ${r.balance}`);
}

export async function adjust(customerId: string, code: string, _: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  const { data, error } = await adminClient().rpc("adjust_points", {
    p_customer_id: customerId,
    p_points: Number(form.get("points")),
    p_note: String(form.get("note") ?? ""),
    p_staff_user_id: staff.id,
  });
  if (error) return { error: errorMessage(error) };
  done(code, `Ajuste registrado · Saldo: ${data}`);
}
