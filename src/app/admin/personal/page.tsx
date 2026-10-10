import { adminClient } from "@/lib/supabase/admin";
import { AdminNotices } from "@/components/AdminNotices";
import { SubmitButton } from "@/components/SubmitButton";
import { createStaff, toggleStaff } from "../actions";

export const metadata = { title: "Personal", robots: { index: false } };

export default async function Personal({ searchParams }: PageProps<"/admin/personal">) {
  const db = adminClient();
  const [{ data: staff }, { data: users }] = await Promise.all([
    db.from("staff_users").select("id, name, role, active").order("created_at"),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailOf = (id: string) => users?.users.find((u) => u.id === id)?.email ?? "";
  return (
    <>
      <h1 className="text-3xl font-black">Personal</h1>
      <AdminNotices searchParams={searchParams} />
      <ul className="card divide-y divide-stone-100 p-0">
        {(staff ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3">
            <span className="flex-1">
              <span className="font-semibold">{s.name}</span>
              <span className="block text-sm text-stone-500">{emailOf(s.id)}</span>
            </span>
            <span className="text-sm">{s.role === "admin" ? "Administrador" : "Cajero"}</span>
            <form action={toggleStaff.bind(null, s.id, !s.active)}>
              <SubmitButton className="btn-ghost py-2 text-sm">{s.active ? "Desactivar" : "Activar"}</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
      <form action={createStaff} className="card grid gap-3 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Agregar persona</h2>
        <div>
          <label className="label">Nombre</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="label">Correo (será su usuario)</label>
          <input className="input" name="email" type="email" required />
        </div>
        <div>
          <label className="label">Contraseña inicial (mínimo 8 caracteres)</label>
          <input className="input" name="password" type="text" minLength={8} required />
        </div>
        <div>
          <label className="label">Rol</label>
          <select className="input" name="role" defaultValue="cashier">
            <option value="cashier">Cajero (solo caja)</option>
            <option value="admin">Administrador (todo)</option>
          </select>
        </div>
        <div className="sm:col-span-2"><SubmitButton>Crear usuario</SubmitButton></div>
      </form>
    </>
  );
}
