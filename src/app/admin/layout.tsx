import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { StaffBar } from "@/components/StaffBar";

const NAV = [
  ["/admin", "Resumen"],
  ["/admin/premios", "Premios"],
  ["/admin/promociones", "Promociones"],
  ["/admin/configuracion", "Reglas y marca"],
  ["/admin/personal", "Personal"],
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff("admin");
  return (
    <div className="flex flex-1 flex-col">
      <StaffBar staff={staff} />
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-3 py-3 text-sm font-medium hover:text-brand">
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}
