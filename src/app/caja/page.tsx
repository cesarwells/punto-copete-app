import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/staff";
import { adminClient } from "@/lib/supabase/admin";
import { isValidRut, normalizeRut, formatRut } from "@/lib/rut";
import { StaffBar } from "@/components/StaffBar";
import { ScannerInput } from "@/components/ScannerInput";

export const metadata = { title: "Caja", robots: { index: false } };

type Row = { member_code: string; name: string; rut: string; phone: string | null };

async function search(q: string): Promise<Row[]> {
  const db = adminClient();
  const cols = "member_code, name, rut, phone";
  const code = q.toUpperCase();
  if (/^[A-Z0-9]{10}$/.test(code)) {
    const { data } = await db.from("customers").select(cols).eq("member_code", code).limit(1);
    if (data?.length) return data;
  }
  if (isValidRut(q)) {
    const { data } = await db.from("customers").select(cols).eq("rut", normalizeRut(q)).limit(1);
    return data ?? [];
  }
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 6) {
    const { data } = await db.from("customers").select(cols).like("phone", `%${digits.slice(-8)}%`).limit(20);
    return data ?? [];
  }
  return [];
}

export default async function Caja({ searchParams }: PageProps<"/caja">) {
  const staff = await requireStaff();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const results = query ? await search(query) : [];
  if (results.length === 1) redirect(`/caja/c/${results[0].member_code}`);

  return (
    <div className="flex flex-1 flex-col">
      <StaffBar staff={staff} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <h1 className="text-3xl font-black">Buscar cliente</h1>
        <ScannerInput />
        {query && results.length === 0 && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
            No encontramos a nadie con «{query}». Revisa el RUT o pide al cliente que se inscriba en /inscribirse.
          </p>
        )}
        {results.length > 1 && (
          <ul className="card divide-y divide-stone-100 p-0">
            {results.map((r) => (
              <li key={r.member_code}>
                <Link href={`/caja/c/${r.member_code}`} className="flex justify-between px-5 py-3 hover:bg-stone-50">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-stone-500">{formatRut(r.rut)} · {r.phone}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
