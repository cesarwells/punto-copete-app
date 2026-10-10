import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getBalance, getCurrentPromotions, getCustomerByToken, getHistory, getActiveRewards, getSettings,
} from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";
import { OkNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { clp, dateTime, num, txTitle } from "@/lib/format";
import { qrSvg } from "@/lib/qr";
import { setMarketing } from "./actions";

export const metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function MiCuenta({ params, searchParams }: PageProps<"/mi-cuenta/[token]">) {
  const { token } = await params;
  const { bienvenida } = await searchParams;
  const customer = await getCustomerByToken(token);
  if (!customer) notFound();

  const [s, balance, history, rewards, promotions, qr] = await Promise.all([
    getSettings(),
    getBalance(customer.id),
    getHistory(customer.id),
    getActiveRewards(),
    getCurrentPromotions(),
    qrSvg(customer.member_code),
  ]);

  return (
    <div style={brandStyle(s)}>
      <BrandHeader settings={s} />
      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        {bienvenida && <OkNotice message={`¡Listo, ${customer.name.split(" ")[0]}! Ya eres parte del club.`} />}

        <section className="rounded-3xl bg-brand p-6 text-white shadow-lg">
          <p className="text-sm opacity-80">Hola, {customer.name}</p>
          <p className="mt-2 text-6xl font-black">{num(balance)}</p>
          <p className="text-lg opacity-90">puntos</p>
          <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white p-4 text-stone-900">
            <div className="size-32 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="text-sm text-stone-500">Muestra este código en caja</p>
              <p className="font-mono text-lg font-bold tracking-wider">{customer.member_code}</p>
            </div>
          </div>
        </section>

        <section className="card space-y-2">
          <h2 className="text-lg font-bold">Agrega tu tarjeta al celular</h2>
          <p className="text-sm text-stone-500">Muy pronto podrás guardarla en Apple Wallet y Google Wallet.</p>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" disabled>Apple Wallet</button>
            <button className="btn-ghost flex-1" disabled>Google Wallet</button>
          </div>
        </section>

        {promotions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">Promociones vigentes</h2>
            {promotions.map((p) => (
              <article key={p.id} className="card flex gap-4">
                {p.image_url && (
                  <Image src={p.image_url} alt="" width={80} height={80} className="size-20 rounded-xl object-cover" />
                )}
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.description && <p className="text-sm text-stone-600">{p.description}</p>}
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Premios</h2>
          {rewards.length === 0 && <p className="text-stone-500">Pronto publicaremos los premios.</p>}
          {rewards.map((r) => {
            const pct = Math.min(100, Math.round((balance / r.points_cost) * 100));
            const missing = r.points_cost - balance;
            return (
              <article key={r.id} className="card flex gap-4">
                {r.image_url && (
                  <Image src={r.image_url} alt="" width={80} height={80} className="size-20 rounded-xl object-cover" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    <span className="whitespace-nowrap font-bold text-brand">{num(r.points_cost)} pts</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm text-stone-600">
                    {missing <= 0 ? "¡Ya puedes canjearlo en caja!" : `Te faltan ${num(missing)} puntos`}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Mis movimientos</h2>
          {history.length === 0 && <p className="text-stone-500">Aún no tienes movimientos.</p>}
          <ul className="card divide-y divide-stone-100 p-0">
            {history.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium">{txTitle(t)}</p>
                  <p className="text-xs text-stone-500">
                    {dateTime(t.created_at)}
                    {t.purchase_amount_clp ? ` · ${clp(t.purchase_amount_clp)}` : ""}
                    {t.receipt_number ? ` · Boleta ${t.receipt_number}` : ""}
                  </p>
                </div>
                <span className={`font-bold ${t.points > 0 ? "text-green-700" : "text-red-700"}`}>
                  {t.points > 0 ? "+" : ""}{num(t.points)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3 text-sm">
          <p>
            {customer.marketing_opt_in
              ? "Recibes promociones y novedades."
              : "No recibes promociones."}
          </p>
          <form action={setMarketing.bind(null, token, !customer.marketing_opt_in)}>
            <SubmitButton className="btn-ghost w-full">
              {customer.marketing_opt_in ? "Dejar de recibir promociones" : "Quiero recibir promociones"}
            </SubmitButton>
          </form>
          <p className="text-xs text-stone-500">Los canjes se hacen en caja, mostrando tu código.</p>
        </section>
      </main>
    </div>
  );
}
