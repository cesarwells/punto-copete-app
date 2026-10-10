import { getSettings } from "@/lib/data";
import { BrandHeader, brandStyle } from "@/components/BrandHeader";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Inscríbete" };

export default async function Inscribirse() {
  const s = await getSettings();
  return (
    <div style={brandStyle(s)}>
      <BrandHeader settings={s} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-8">
        <h1 className="text-3xl font-black">Únete al club</h1>
        {s.welcome_bonus_points > 0 && (
          <p className="text-stone-600">
            Te regalamos <strong>{s.welcome_bonus_points} puntos</strong> de bienvenida.
          </p>
        )}
        <RegisterForm />
      </main>
    </div>
  );
}
