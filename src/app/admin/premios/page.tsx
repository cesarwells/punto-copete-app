import Image from "next/image";
import { adminClient } from "@/lib/supabase/admin";
import type { Reward } from "@/lib/data";
import { AdminNotices } from "@/components/AdminNotices";
import { SubmitButton } from "@/components/SubmitButton";
import { num } from "@/lib/format";
import { saveReward } from "../actions";

export const metadata = { title: "Premios", robots: { index: false } };

const CATEGORIES = ["comida", "bebidas sin alcohol", "otros"];

function RewardForm({ r }: { r?: Reward }) {
  return (
    <form action={saveReward} className="grid gap-3 sm:grid-cols-2">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div>
        <label className="label">Nombre</label>
        <input className="input" name="name" defaultValue={r?.name} required />
      </div>
      <div>
        <label className="label">Puntos que cuesta</label>
        <input className="input" name="points_cost" type="number" min={1} defaultValue={r?.points_cost} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Descripción</label>
        <input className="input" name="description" defaultValue={r?.description ?? ""} />
      </div>
      <div>
        <label className="label">Categoría</label>
        <select className="input" name="category" defaultValue={r?.category ?? "comida"}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Stock (vacío = sin límite)</label>
        <input className="input" name="stock" type="number" min={0} defaultValue={r?.stock ?? ""} />
      </div>
      <div>
        <label className="label">Orden en la carta</label>
        <input className="input" name="sort_order" type="number" defaultValue={r?.sort_order ?? 0} />
      </div>
      <div>
        <label className="label">Foto (JPG, PNG o WEBP)</label>
        <input className="input" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="active" defaultChecked={r?.active ?? true} className="size-5" /> Activo
      </label>
      <div className="sm:col-span-2"><SubmitButton>{r ? "Guardar cambios" : "Crear premio"}</SubmitButton></div>
    </form>
  );
}

export default async function Premios({ searchParams }: PageProps<"/admin/premios">) {
  const { data } = await adminClient().from("rewards").select("*").order("sort_order").order("points_cost");
  const rewards = (data ?? []) as Reward[];
  return (
    <>
      <h1 className="text-3xl font-black">Premios</h1>
      <AdminNotices searchParams={searchParams} />
      <details className="card" open={rewards.length === 0}>
        <summary className="cursor-pointer text-lg font-semibold">+ Nuevo premio</summary>
        <div className="mt-4"><RewardForm /></div>
      </details>
      <div className="space-y-3">
        {rewards.map((r) => (
          <details key={r.id} className="card">
            <summary className="flex cursor-pointer items-center gap-4">
              {r.image_url ? (
                <Image src={r.image_url} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" />
              ) : <span className="size-12 rounded-lg bg-stone-100" />}
              <span className="flex-1 font-semibold">{r.name}</span>
              <span className="text-sm text-stone-500">{r.category}</span>
              <span className="font-bold">{num(r.points_cost)} pts</span>
              {!r.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs">pausado</span>}
            </summary>
            <div className="mt-4"><RewardForm r={r} /></div>
          </details>
        ))}
      </div>
    </>
  );
}
