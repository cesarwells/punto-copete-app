import Link from "next/link";
import type { Staff } from "@/lib/staff";
import { logout } from "@/app/caja/actions";

export function StaffBar({ staff }: { staff: Staff }) {
  return (
    <header className="bg-stone-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/caja" className="text-lg font-bold">Punto Copete · Caja</Link>
        {staff.role === "admin" && (
          <Link href="/admin" className="rounded-lg px-3 py-1 text-sm hover:bg-white/10">Administración</Link>
        )}
        <span className="ml-auto text-sm opacity-80">{staff.name}</span>
        <form action={logout}>
          <button className="rounded-lg px-3 py-1 text-sm hover:bg-white/10">Salir</button>
        </form>
      </div>
    </header>
  );
}
