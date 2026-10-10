import { LoginForm } from "./LoginForm";

export const metadata = { title: "Caja · Iniciar sesión", robots: { index: false } };

export default function Login() {
  return (
    <main className="mx-auto w-full max-w-sm space-y-4 px-4 py-16">
      <h1 className="text-3xl font-black">Caja</h1>
      <p className="text-stone-600">Inicia sesión con tu usuario de personal.</p>
      <LoginForm />
    </main>
  );
}
