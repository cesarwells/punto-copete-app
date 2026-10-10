import { adminClient } from "@/lib/supabase/admin";
import { num } from "@/lib/format";

export const metadata = { title: "Administración", robots: { index: false } };

export default async function AdminHome() {
  const db = adminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [customers, newCustomers, balances] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }),
    db.from("customers").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
    db.from("customer_balances").select("balance, total_earned, total_redeemed"),
  ]);
  const rows = balances.data ?? [];
  const sum = (k: "balance" | "total_earned" | "total_redeemed") => rows.reduce((a, r) => a + r[k], 0);
  const stats = [
    ["Clientes inscritos", customers.count ?? 0],
    ["Nuevos este mes", newCustomers.count ?? 0],
    ["Puntos emitidos", sum("total_earned")],
    ["Puntos canjeados", sum("total_redeemed")],
    ["Puntos vigentes", sum("balance")],
  ] as const;
  return (
    <>
      <h1 className="text-3xl font-black">Resumen</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="text-3xl font-black">{num(value)}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-stone-500">Más métricas y exportación a CSV llegan en una próxima fase.</p>
    </>
  );
}
