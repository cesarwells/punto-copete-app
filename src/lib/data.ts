import "server-only";
import { adminClient } from "./supabase/admin";

export type Settings = {
  business_name: string;
  logo_url: string | null;
  brand_primary: string;
  brand_secondary: string;
  points_per_1000_clp: number;
  points_expiration_months: number | null;
  welcome_bonus_points: number;
  birthday_bonus_points: number;
};

export type Customer = {
  id: string;
  member_code: string;
  rut: string;
  name: string;
  phone: string | null;
  email: string;
  birth_date: string | null;
  portal_token: string;
  marketing_opt_in: boolean;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  category: string;
  stock: number | null;
  active: boolean;
  sort_order: number;
};

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  highlight: boolean;
  type: string;
  multiplier: number | null;
};

export type Transaction = {
  id: string;
  type: string;
  points: number;
  purchase_amount_clp: number | null;
  receipt_number: string | null;
  note: string | null;
  created_at: string;
  staff_users?: { name: string } | null;
};

export async function getSettings(): Promise<Settings> {
  const { data, error } = await adminClient().from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function getBalance(customerId: string): Promise<number> {
  const { data } = await adminClient()
    .from("customer_balances")
    .select("balance")
    .eq("customer_id", customerId)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function getHistory(customerId: string, limit = 200): Promise<Transaction[]> {
  const { data, error } = await adminClient()
    .from("point_transactions")
    .select("id, type, points, purchase_amount_clp, receipt_number, note, created_at, staff_users(name)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Transaction[];
}

export async function getActiveRewards(): Promise<Reward[]> {
  const { data, error } = await adminClient()
    .from("rewards")
    .select("*")
    .eq("active", true)
    .order("sort_order")
    .order("points_cost");
  if (error) throw error;
  return data;
}

export async function getCurrentPromotions(): Promise<Promotion[]> {
  const now = new Date().toISOString();
  const { data, error } = await adminClient()
    .from("promotions")
    .select("*")
    .eq("active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("highlight", { ascending: false })
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCustomerByToken(token: string): Promise<Customer | null> {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) return null;
  const { data } = await adminClient().from("customers").select("*").eq("portal_token", token).maybeSingle();
  return data;
}

export async function getCustomerByCode(code: string): Promise<Customer | null> {
  const { data } = await adminClient()
    .from("customers")
    .select("*")
    .eq("member_code", code.trim().toUpperCase())
    .maybeSingle();
  return data;
}
