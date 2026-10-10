"use client";
import { useEffect, useRef } from "react";

// Campo que recibe la lectura del lector QR USB (escribe el código + Enter).
// Mantiene el foco salvo que el cajero esté escribiendo en otro campo.
export function ScannerInput({ defaultValue = "" }: { defaultValue?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    const refocus = () => {
      setTimeout(() => {
        const active = document.activeElement;
        const busy = active && active !== document.body && active !== input &&
          ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
        const dialogOpen = document.querySelector("dialog[open]");
        if (!busy && !dialogOpen) input.focus();
      }, 50);
    };
    document.addEventListener("focusout", refocus);
    document.addEventListener("click", refocus);
    return () => {
      document.removeEventListener("focusout", refocus);
      document.removeEventListener("click", refocus);
    };
  }, []);

  return (
    <form action="/caja" className="flex gap-2">
      <input
        ref={ref}
        name="q"
        defaultValue={defaultValue}
        autoComplete="off"
        placeholder="Escanea el QR o escribe RUT / teléfono"
        className="input text-lg"
      />
      <button className="btn-primary" type="submit">Buscar</button>
    </form>
  );
}
