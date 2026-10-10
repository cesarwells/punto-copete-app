"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { earn, redeem, adjust, type FormState } from "../../actions";
import { ErrorNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(n);

export function SuccessBanner({ message }: { message: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      router.replace(window.location.pathname, { scroll: false });
    }, 6000);
    return () => clearTimeout(t);
  }, [router]);
  if (!visible) return null;
  return (
    <div role="status" className="rounded-3xl bg-green-600 px-6 py-8 text-center text-3xl font-black text-white shadow-lg">
      ✓ {message}
    </div>
  );
}

export function EarnForm({ customerId, code, pointsPer1000, multiplier }: {
  customerId: string; code: string; pointsPer1000: number; multiplier: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(earn.bind(null, customerId, code), {});
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const value = Number(amount.replace(/\D/g, "")) || 0;
  const points = Math.floor((value / 1000) * pointsPer1000 * multiplier);

  return (
    <form action={action} className="card space-y-4">
      <h2 className="text-xl font-bold">Sumar compra</h2>
      <ErrorNotice message={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">Monto de la compra ($)</label>
          <input
            className="input text-2xl font-bold" id="amount" name="amount" inputMode="numeric" required
            value={amount ? fmt(value) : ""}
            onChange={(e) => { setAmount(e.target.value); setConfirming(false); }}
          />
        </div>
        <div>
          <label className="label" htmlFor="receipt">N.º de boleta (opcional)</label>
          <input className="input" id="receipt" name="receipt" />
        </div>
      </div>
      <p className="text-lg">
        Suma <strong className="text-2xl text-brand">{fmt(points)}</strong> puntos
        {multiplier > 1 && <span className="ml-2 rounded-full bg-accent px-3 py-1 text-sm font-bold">Promoción x{multiplier}</span>}
      </p>
      {!confirming ? (
        <button type="button" className="btn-primary w-full text-lg" disabled={points <= 0}
          onClick={() => setConfirming(true)}>
          Sumar puntos
        </button>
      ) : (
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => setConfirming(false)}>Cancelar</button>
          <SubmitButton className="btn-accent flex-[2] text-lg">Confirmar +{fmt(points)} puntos</SubmitButton>
        </div>
      )}
    </form>
  );
}

export function RedeemButton({ customerId, code, rewardId, name, cost, enabled }: {
  customerId: string; code: string; rewardId: string; name: string; cost: number; enabled: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <>
      <button className="btn-accent" disabled={!enabled} onClick={() => { setError(undefined); dialog.current?.showModal(); }}>
        Canjear
      </button>
      <dialog ref={dialog} className="m-auto w-full max-w-md rounded-3xl p-6 backdrop:bg-black/50">
        <h3 className="text-2xl font-black">¿Canjear {name}?</h3>
        <p className="mt-2 text-lg">Se descontarán <strong>{fmt(cost)} puntos</strong>.</p>
        <div className="mt-3"><ErrorNotice message={error} /></div>
        <div className="mt-6 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => dialog.current?.close()}>Cancelar</button>
          <button className="btn-accent flex-[2]" disabled={pending}
            onClick={() => start(async () => {
              const res = await redeem(customerId, code, rewardId);
              if (res?.error) setError(res.error);
            })}>
            {pending ? "Canjeando…" : "Confirmar canje"}
          </button>
        </div>
      </dialog>
    </>
  );
}

export function AdjustForm({ customerId, code }: { customerId: string; code: string }) {
  const [state, action] = useActionState<FormState, FormData>(adjust.bind(null, customerId, code), {});
  return (
    <details className="card">
      <summary className="cursor-pointer font-semibold">Ajuste manual (solo administrador)</summary>
      <form action={action} className="mt-4 space-y-3">
        <ErrorNotice message={state.error} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="points">Puntos (+ o −)</label>
            <input className="input" id="points" name="points" type="number" required placeholder="-20" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="note">Motivo (obligatorio)</label>
            <input className="input" id="note" name="note" required minLength={5} />
          </div>
        </div>
        <SubmitButton className="btn-ghost">Registrar ajuste</SubmitButton>
      </form>
    </details>
  );
}
