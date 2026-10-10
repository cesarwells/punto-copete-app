import { getSettings } from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";

export const metadata = { title: "Términos y privacidad" };

// BORRADOR: revisar con un abogado antes del lanzamiento.
export default async function Terminos() {
  const s = await getSettings();
  return (
    <div style={brandStyle(s)}>
      <BrandHeader settings={s} />
      <main className="prose mx-auto max-w-3xl space-y-4 px-4 py-10 text-stone-700">
        <h1 className="text-3xl font-bold text-stone-900">Términos del programa y política de privacidad</h1>
        <h2 className="text-xl font-semibold text-stone-900">El programa</h2>
        <ul className="list-disc pl-6">
          <li>Sumas {s.points_per_1000_clp} punto(s) por cada $1.000 de compra.</li>
          {s.points_expiration_months && (
            <li>Los puntos vencen si pasan {s.points_expiration_months} meses sin compras.</li>
          )}
          <li>Los canjes se hacen solo en el local. Los puntos no son canjeables por dinero.</li>
          <li>Los premios con alcohol, si los hubiera, se entregan solo a mayores de 18 años.</li>
        </ul>
        <h2 className="text-xl font-semibold text-stone-900">Tus datos (Ley 19.628)</h2>
        <ul className="list-disc pl-6">
          <li>Guardamos tu RUT, nombre, teléfono, correo y, si nos la das, tu fecha de nacimiento.</li>
          <li>Los usamos para identificarte, llevar tus puntos y, solo si lo aceptas, enviarte promociones.</li>
          <li>No vendemos ni compartimos tus datos con terceros.</li>
          <li>Puedes dejar de recibir promociones desde tu cuenta, y pedir en el local que corrijamos o eliminemos tus datos.</li>
        </ul>
      </main>
    </div>
  );
}
