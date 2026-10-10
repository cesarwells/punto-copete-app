"use client";
import { useActionState } from "react";
import { login, type FormState } from "../actions";
import { ErrorNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="card space-y-4">
      <ErrorNotice message={state.error} />
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input className="input" id="email" name="email" type="email" required autoFocus defaultValue={state.email} />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input className="input" id="password" name="password" type="password" required />
      </div>
      <SubmitButton className="btn-primary w-full">Entrar</SubmitButton>
    </form>
  );
}
