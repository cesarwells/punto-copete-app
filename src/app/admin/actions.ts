"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/staff";
import { uploadImage } from "@/lib/upload";
import { chileLocalToIso, errorMessage } from "@/lib/format";

function back(path: string, result: { ok?: string; error?: string }): never {
  revalidatePath(path);
  const q = result.error ? `error=${encodeURIComponent(result.error)}` : `ok=${encodeURIComponent(result.ok ?? "")}`;
  redirect(`${path}?${q}`);
}

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optInt = (f: FormData, k: string) => (text(f, k) === "" ? null : Number(text(f, k)));

// ---------------- Premios ----------------
export async function saveReward(form: FormData) {
  await requireStaff("admin");
  const id = text(form, "id");
  let result: { ok?: string; error?: string };
  try {
    const image = await uploadImage(form.get("image"), "premios");
    const row = {
      name: text(form, "name"),
      description: text(form, "description") || null,
      points_cost: Number(text(form, "points_cost")),
      category: text(form, "category"),
      stock: optInt(form, "stock"),
      sort_order: Number(text(form, "sort_order") || 0),
      active: form.get("active") === "on",
      ...(image ? { image_url: image } : {}),
    };
    const db = adminClient().from("rewards");
    const { error } = id ? await db.update(row).eq("id", id) : await db.insert(row);
    result = error ? { error: errorMessage(error) } : { ok: id ? "Premio actualizado." : "Premio creado." };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  back("/admin/premios", result);
}

// ---------------- Promociones ----------------
export async function savePromotion(form: FormData) {
  await requireStaff("admin");
  const id = text(form, "id");
  let result: { ok?: string; error?: string };
  try {
    const image = await uploadImage(form.get("image"), "promociones");
    const type = text(form, "type");
    const row = {
      title: text(form, "title"),
      description: text(form, "description") || null,
      type,
      multiplier: type === "puntos dobles" ? Number(text(form, "multiplier") || 2) : null,
      starts_at: chileLocalToIso(text(form, "starts_at")) ?? new Date().toISOString(),
      ends_at: chileLocalToIso(text(form, "ends_at")),
      highlight: form.get("highlight") === "on",
      active: form.get("active") === "on",
      ...(image ? { image_url: image } : {}),
    };
    const db = adminClient().from("promotions");
    const { error } = id ? await db.update(row).eq("id", id) : await db.insert(row);
    result = error ? { error: errorMessage(error) } : { ok: id ? "Promoción actualizada." : "Promoción creada." };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  back("/admin/promociones", result);
}

// ---------------- Reglas y marca ----------------
export async function saveSettings(form: FormData) {
  await requireStaff("admin");
  let result: { ok?: string; error?: string };
  try {
    const logo = await uploadImage(form.get("logo"), "marca");
    const { error } = await adminClient()
      .from("settings")
      .update({
        business_name: text(form, "business_name"),
        brand_primary: text(form, "brand_primary"),
        brand_secondary: text(form, "brand_secondary"),
        points_per_1000_clp: Number(text(form, "points_per_1000_clp")),
        points_expiration_months: optInt(form, "points_expiration_months"),
        welcome_bonus_points: Number(text(form, "welcome_bonus_points") || 0),
        birthday_bonus_points: Number(text(form, "birthday_bonus_points") || 0),
        updated_at: new Date().toISOString(),
        ...(logo ? { logo_url: logo } : {}),
      })
      .eq("id", 1);
    result = error ? { error: errorMessage(error) } : { ok: "Configuración guardada." };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  back("/admin/configuracion", result);
}

// ---------------- Personal ----------------
export async function createStaff(form: FormData) {
  await requireStaff("admin");
  const email = text(form, "email").toLowerCase();
  const password = text(form, "password");
  if (password.length < 8) back("/admin/personal", { error: "La contraseña debe tener al menos 8 caracteres." });
  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) back("/admin/personal", { error: `No se pudo crear el usuario: ${error.message}` });
  const role = text(form, "role") === "admin" ? "admin" : "cashier";
  const { error: e2 } = await db.from("staff_users").insert({ id: data.user!.id, name: text(form, "name"), role });
  back("/admin/personal", e2 ? { error: errorMessage(e2) } : { ok: `Usuario ${email} creado.` });
}

export async function toggleStaff(id: string, active: boolean) {
  const me = await requireStaff("admin");
  if (id === me.id) back("/admin/personal", { error: "No puedes desactivarte a ti mismo." });
  await adminClient().from("staff_users").update({ active }).eq("id", id);
  back("/admin/personal", { ok: active ? "Usuario activado." : "Usuario desactivado." });
}
