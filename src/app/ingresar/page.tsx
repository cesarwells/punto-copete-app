import Link from "next/link";
import { getSettings } from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";
import { RutForm } from "./Forms";

export const metadata = { title: "Entrar a mi cuenta" };

export default async function Ingresar() {
  const s = await getSettings();
  return (
    <div style={brandStyle(s)}>
      <BrandHeader settings={s} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-8">
        <h1 className="text-3xl font-black">Entrar a mi cuenta</h1>
        <p className="text-stone-600">Escribe tu RUT y te enviaremos un código a tu correo.</p>
        <RutForm />
        <p className="text-center text-sm text-stone-500">
          ¿No estás inscrito? <Link className="underline" href="/inscribirse">Inscríbete aquí</Link>
        </p>
      </main>
    </div>
  );
}
