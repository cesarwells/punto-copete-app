import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/server";
import { adminClient } from "./supabase/admin";

export type Staff = { id: string; name: string; role: "cashier" | "admin" };

export async function getStaff(): Promise<Staff | null> {
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: staff } = await adminClient()
    .from("staff_users")
    .select("id, name, role, active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!staff || !staff.active) return null;
  return { id: staff.id, name: staff.name, role: staff.role };
}

// Exige personal con sesión iniciada; para /admin exige rol admin.
export async function requireStaff(role?: "admin"): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/caja/login");
  if (role === "admin" && staff.role !== "admin") redirect("/caja");
  return staff;
}
