import Link from "next/link";
import { getSettings } from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";

export default async function Home() {
  const settings = await getSettings();
  return (
    <div style={brandStyle(settings)} className="flex flex-1 flex-col">
      <BrandHeader settings={settings} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-12">
        <h1 className="text-4xl font-black tracking-tight">Suma puntos en cada compra</h1>
        <p className="text-lg text-stone-600">
          Inscríbete gratis en el club de {settings.business_name}, junta puntos y canjéalos por premios.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/inscribirse" className="btn-primary">Únete y empieza a sumar</Link>
          <Link href="/ingresar" className="btn-ghost">Ya soy socio</Link>
        </div>
      </main>
    </div>
  );
}
