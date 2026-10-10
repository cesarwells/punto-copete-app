import Image from "next/image";
import { getSettings } from "@/lib/data";
import { AdminNotices } from "@/components/AdminNotices";
import { SubmitButton } from "@/components/SubmitButton";
import { saveSettings } from "../actions";

export const metadata = { title: "Reglas y marca", robots: { index: false } };

export default async function Configuracion({ searchParams }: PageProps<"/admin/configuracion">) {
  const s = await getSettings();
  return (
    <>
      <h1 className="text-3xl font-black">Reglas y marca</h1>
      <AdminNotices searchParams={searchParams} />
      <form action={saveSettings} className="card grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Reglas del programa</h2>
        <div>
          <label className="label">Puntos por cada $1.000</label>
          <input className="input" name="points_per_1000_clp" type="number" step="0.01" min={0.01}
            defaultValue={s.points_per_1000_clp} required />
        </div>
        <div>
          <label className="label">Meses sin compras para que venzan (vacío = no vencen)</label>
          <input className="input" name="points_expiration_months" type="number" min={1}
            defaultValue={s.points_expiration_months ?? ""} />
        </div>
        <div>
          <label className="label">Bono de bienvenida (puntos)</label>
          <input className="input" name="welcome_bonus_points" type="number" min={0} defaultValue={s.welcome_bonus_points} />
        </div>
        <div>
          <label className="label">Bono de cumpleaños (puntos)</label>
          <input className="input" name="birthday_bonus_points" type="number" min={0} defaultValue={s.birthday_bonus_points} />
        </div>

        <h2 className="pt-4 text-lg font-bold sm:col-span-2">Marca</h2>
        <div>
          <label className="label">Nombre del negocio</label>
          <input className="input" name="business_name" defaultValue={s.business_name} required />
        </div>
        <div className="flex items-end gap-4">
          {s.logo_url && <Image src={s.logo_url} alt="Logo" width={56} height={56} className="rounded-lg object-contain" />}
          <div className="flex-1">
            <label className="label">Logo (PNG con fondo transparente, ideal)</label>
            <input className="input" name="logo" type="file" accept="image/jpeg,image/png,image/webp" />
          </div>
        </div>
        <div>
          <label className="label">Color principal</label>
          <input className="input h-14" name="brand_primary" type="color" defaultValue={s.brand_primary} />
        </div>
        <div>
          <label className="label">Color secundario</label>
          <input className="input h-14" name="brand_secondary" type="color" defaultValue={s.brand_secondary} />
        </div>
        <div className="sm:col-span-2"><SubmitButton>Guardar</SubmitButton></div>
      </form>
    </>
  );
}
