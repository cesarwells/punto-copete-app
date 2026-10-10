import Link from "next/link";
import { getSettings } from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";
import { CodeForm } from "../Forms";

export const metadata = { title: "Escribe tu código" };

export default async function Codigo() {
  const s = await getSettings();
  return (
    <div style={brandStyle(s)}>
      <BrandHeader settings={s} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-8">
        <h1 className="text-3xl font-black">Revisa tu correo</h1>
        <p className="text-stone-600">
          Si tu RUT está inscrito, te enviamos un código de 6 dígitos. Vence en 10 minutos.
        </p>
        <CodeForm />
        <p className="text-center text-sm text-stone-500">
          <Link className="underline" href="/ingresar">Pedir otro código</Link>
        </p>
      </main>
    </div>
  );
}
