"use client";
import { useActionState } from "react";
import { requestCode, verifyCode, type FormState } from "./actions";
import { ErrorNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export function RutForm() {
  const [state, action] = useActionState<FormState, FormData>(requestCode, {});
  return (
    <form action={action} className="card space-y-4">
      <ErrorNotice message={state.error} />
      <div>
        <label className="label" htmlFor="rut">Tu RUT</label>
        <input className="input" id="rut" name="rut" placeholder="12.345.678-9" required autoFocus />
      </div>
      <SubmitButton className="btn-primary w-full">Enviarme un código</SubmitButton>
    </form>
  );
}

export function CodeForm() {
  const [state, action] = useActionState<FormState, FormData>(verifyCode, {});
  return (
    <form action={action} className="card space-y-4">
      <ErrorNotice message={state.error} />
      <div>
        <label className="label" htmlFor="code">Código de 6 dígitos</label>
        <input
          className="input text-center text-2xl tracking-[0.5em]"
          id="code" name="code" inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} pattern="\d{6}" required autoFocus
        />
      </div>
      <SubmitButton className="btn-primary w-full">Entrar</SubmitButton>
    </form>
  );
}
