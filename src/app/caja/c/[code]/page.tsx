import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import {
  getActiveRewards, getBalance, getCurrentPromotions, getCustomerByCode, getHistory, getSettings,
} from "@/lib/data";
import { adminClient } from "@/lib/supabase/admin";
import { StaffBar } from "@/components/StaffBar";
import { ScannerInput } from "@/components/ScannerInput";
import { clp, dateTime, num, txTitle } from "@/lib/format";
import { formatRut } from "@/lib/rut";
import { AdjustForm, EarnForm, RedeemButton, SuccessBanner } from "./CashierActions";

export const metadata = { title: "Ficha del cliente", robots: { index: false } };

export default async function Ficha({ params, searchParams }: PageProps<"/caja/c/[code]">) {
  const staff = await requireStaff();
  const { code } = await params;
  const { ok } = await searchParams;
  const customer = await getCustomerByCode(code);
  if (!customer) notFound();

  const [s, balance, history, rewards, promotions, mult] = await Promise.all([
    getSettings(),
    getBalance(customer.id),
    getHistory(customer.id, 10),
    getActiveRewards(),
    getCurrentPromotions(),
    adminClient().rpc("current_points_multiplier"),
  ]);
  const multiplier = Number(mult.data ?? 1);
  const available = rewards.filter((r) => r.points_cost <= balance && r.stock !== 0);
  const pending = rewards.filter((r) => !available.includes(r));

  return (
    <div className="flex flex-1 flex-col">
      <StaffBar staff={staff} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
        <ScannerInput />
        {typeof ok === "string" && <SuccessBanner key={ok} message={ok} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-stone-900 p-6 text-white">
              <p className="text-2xl font-bold">{customer.name}</p>
              <p className="text-sm opacity-70">
                {formatRut(customer.rut)} · {customer.phone} · Socio {customer.member_code}
              </p>
              <p className="mt-4 text-7xl font-black text-accent">{num(balance)}</p>
              <p className="text-lg opacity-80">puntos disponibles</p>
            </section>

            {promotions.length > 0 && (
              <section className="card space-y-2">
                <h2 className="font-bold">Promociones activas hoy</h2>
                <ul className="space-y-1">
                  {promotions.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      {p.type === "puntos dobles" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold">x{p.multiplier}</span>
                      )}
                      {p.title}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="card space-y-2">
              <h2 className="font-bold">Últimos movimientos</h2>
              {history.length === 0 && <p className="text-stone-500">Sin movimientos.</p>}
              <ul className="divide-y divide-stone-100">
                {history.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="font-medium">{txTitle(t)}</span>
                      <span className="block text-xs text-stone-500">
                        {dateTime(t.created_at)}
                        {t.purchase_amount_clp ? ` · ${clp(t.purchase_amount_clp)}` : ""}
                        {t.staff_users?.name ? ` · ${t.staff_users.name}` : ""}
                      </span>
                    </span>
                    <span className={`font-bold ${t.points > 0 ? "text-green-700" : "text-red-700"}`}>
                      {t.points > 0 ? "+" : ""}{num(t.points)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <EarnForm customerId={customer.id} code={customer.member_code}
              pointsPer1000={Number(s.points_per_1000_clp)} multiplier={multiplier} />

            <section className="card space-y-3">
              <h2 className="text-xl font-bold">Puede canjear ahora</h2>
              {available.length === 0 && <p className="text-stone-500">Todavía no alcanza para ningún premio.</p>}
              {available.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-green-50 p-3 ring-2 ring-green-500">
                  <div>
                    <p className="text-lg font-semibold">{r.name}</p>
                    <p className="text-sm text-stone-600">
                      {num(r.points_cost)} puntos{r.stock != null ? ` · quedan ${r.stock}` : ""}
                    </p>
                  </div>
                  <RedeemButton customerId={customer.id} code={customer.member_code} rewardId={r.id}
                    name={r.name} cost={r.points_cost} enabled />
                </div>
              ))}
              {pending.length > 0 && (
                <>
                  <h3 className="pt-2 font-semibold text-stone-500">Le faltan puntos para</h3>
                  {pending.map((r) => (
                    <div key={r.id} className="flex justify-between rounded-xl bg-stone-50 p-3 text-stone-600">
                      <span>{r.name}{r.stock === 0 ? " (sin stock)" : ""}</span>
                      <span>faltan {num(Math.max(0, r.points_cost - balance))}</span>
                    </div>
                  ))}
                </>
              )}
            </section>

            {staff.role === "admin" && <AdjustForm customerId={customer.id} code={customer.member_code} />}
          </div>
        </div>
      </main>
    </div>
  );
}
