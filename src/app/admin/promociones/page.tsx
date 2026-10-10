import Image from "next/image";
import { adminClient } from "@/lib/supabase/admin";
import type { Promotion } from "@/lib/data";
import { AdminNotices } from "@/components/AdminNotices";
import { SubmitButton } from "@/components/SubmitButton";
import { date, isoToChileLocal } from "@/lib/format";
import { savePromotion } from "../actions";

export const metadata = { title: "Promociones", robots: { index: false } };

const TYPES = ["descuento", "puntos dobles", "combo", "otro"];

function PromotionForm({ p }: { p?: Promotion }) {
  return (
    <form action={savePromotion} className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="sm:col-span-2">
        <label className="label">Título</label>
        <input className="input" name="title" defaultValue={p?.title} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Descripción</label>
        <input className="input" name="description" defaultValue={p?.description ?? ""} />
      </div>
      <div>
        <label className="label">Tipo</label>
        <select className="input" name="type" defaultValue={p?.type ?? "otro"}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Multiplicador (solo &quot;puntos dobles&quot;)</label>
        <input className="input" name="multiplier" type="number" step="0.5" min={1} defaultValue={p?.multiplier ?? 2} />
      </div>
      <div>
        <label className="label">Empieza</label>
        <input className="input" name="starts_at" type="datetime-local" defaultValue={isoToChileLocal(p?.starts_at ?? null)} />
      </div>
      <div>
        <label className="label">Termina (vacío = sin fecha de término)</label>
        <input className="input" name="ends_at" type="datetime-local" defaultValue={isoToChileLocal(p?.ends_at ?? null)} />
      </div>
      <div>
        <label className="label">Foto</label>
        <input className="input" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <div className="flex flex-col justify-end gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="highlight" defaultChecked={p?.highlight} className="size-5" /> Destacada
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="size-5" /> Activa
        </label>
      </div>
      <div className="sm:col-span-2"><SubmitButton>{p ? "Guardar cambios" : "Crear promoción"}</SubmitButton></div>
    </form>
  );
}

export default async function Promociones({ searchParams }: PageProps<"/admin/promociones">) {
  const { data } = await adminClient().from("promotions").select("*").order("starts_at", { ascending: false });
  const promos = (data ?? []) as Promotion[];
  return (
    <>
      <h1 className="text-3xl font-black">Promociones</h1>
      <AdminNotices searchParams={searchParams} />
      <details className="card" open={promos.length === 0}>
        <summary className="cursor-pointer text-lg font-semibold">+ Nueva promoción</summary>
        <div className="mt-4"><PromotionForm /></div>
      </details>
      <div className="space-y-3">
        {promos.map((p) => (
          <details key={p.id} className="card">
            <summary className="flex cursor-pointer items-center gap-4">
              {p.image_url ? (
                <Image src={p.image_url} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" />
              ) : <span className="size-12 rounded-lg bg-stone-100" />}
              <span className="flex-1 font-semibold">{p.title}</span>
              <span className="text-sm text-stone-500">
                {p.type}{p.multiplier ? ` x${p.multiplier}` : ""} · {date(p.starts_at)}
                {p.ends_at ? ` – ${date(p.ends_at)}` : ""}
              </span>
              {!p.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs">pausada</span>}
            </summary>
            <div className="mt-4"><PromotionForm p={p} /></div>
          </details>
        ))}
      </div>
    </>
  );
}
