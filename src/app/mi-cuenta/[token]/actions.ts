"use server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { getCustomerByToken } from "@/lib/data";

export async function setMarketing(token: string, optIn: boolean) {
  const customer = await getCustomerByToken(token);
  if (!customer) return;
  await adminClient().from("customers").update({ marketing_opt_in: optIn }).eq("id", customer.id);
  revalidatePath(`/mi-cuenta/${token}`);
}
