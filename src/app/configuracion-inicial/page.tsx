import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { sessionClient } from "@/lib/supabase/server";
import { ErrorNotice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Configuración inicial", robots: { index: false } };

async function hasStaff() {
  const { count } = await adminClient().from("staff_users").select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

// Crea el primer administrador. Solo funciona mientras no exista nadie del personal.
async function createFirstAdmin(form: FormData) {
  "use server";
  if (await hasStaff()) redirect("/caja/login");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) redirect("/configuracion-inicial?error=La contraseña debe tener al menos 8 caracteres.");
  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) redirect(`/configuracion-inicial?error=${encodeURIComponent(error.message)}`);
  await db.from("staff_users").insert({ id: data.user!.id, name: String(form.get("name") ?? "Administrador"), role: "admin" });
  await (await sessionClient()).auth.signInWithPassword({ email, password });
  redirect("/admin");
}

export default async function ConfiguracionInicial({ searchParams }: PageProps<"/configuracion-inicial">) {
  if (await hasStaff()) redirect("/caja/login");
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-16">
      <h1 className="text-3xl font-black">Bienvenido</h1>
      <p className="text-stone-600">Crea tu usuario de administrador. Esta página desaparece apenas lo crees.</p>
      <form action={createFirstAdmin} className="card space-y-4">
        <ErrorNotice message={typeof error === "string" ? error : null} />
        <div>
          <label className="label" htmlFor="name">Tu nombre</label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <SubmitButton className="btn-primary w-full">Crear administrador</SubmitButton>
      </form>
    </main>
  );
}
