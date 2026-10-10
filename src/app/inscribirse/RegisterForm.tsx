"use client";
import { useActionState } from "react";
import Link from "next/link";
import { register, type FormState } from "./actions";
import { ErrorNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, {});
  const v = state.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="card space-y-4">
      <ErrorNotice message={state.error} />
      <div>
        <label className="label" htmlFor="rut">RUT</label>
        <input className="input" id="rut" name="rut" defaultValue={v.rut} placeholder="12.345.678-9" required autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="name">Nombre y apellido</label>
        <input className="input" id="name" name="name" defaultValue={v.name} required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Teléfono</label>
        <input className="input" id="phone" name="phone" defaultValue={v.phone} type="tel" placeholder="+56 9 1234 5678" required autoComplete="tel" />
      </div>
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input className="input" id="email" name="email" defaultValue={v.email} type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="birth_date">Fecha de nacimiento (opcional, para tu regalo de cumpleaños)</label>
        <input className="input" id="birth_date" name="birth_date" defaultValue={v.birth_date} type="date" />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required defaultChecked={v.terms === "on"} className="mt-1 size-5" />
        <span>
          Acepto los <Link href="/terminos" target="_blank" className="underline">términos y la política de privacidad</Link>.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="marketing" defaultChecked={v.marketing === "on"} className="mt-1 size-5" />
        <span>Quiero recibir promociones y novedades.</span>
      </label>
      <SubmitButton className="btn-primary w-full">Inscribirme</SubmitButton>
    </form>
  );
}
