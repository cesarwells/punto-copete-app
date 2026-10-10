const TZ = "America/Santiago";

export const clp = (n: number | null | undefined) =>
  n == null ? "" : new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export const num = (n: number) => new Intl.NumberFormat("es-CL").format(n);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export const date = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { timeZone: TZ, dateStyle: "medium" }).format(new Date(iso));

export const TX_LABEL: Record<string, string> = {
  earn: "Compra",
  redeem: "Canje",
  adjustment: "Ajuste",
  bonus: "Bono",
  expiration: "Vencimiento",
};

// Mensaje de error legible desde un error de Supabase/Postgres.
export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    const m = String((e as { message: unknown }).message);
    if (/^[A-ZÁÉÍÓÚ]/.test(m) && !m.includes("violates")) return m;
  }
  return "Ocurrió un error. Inténtalo de nuevo.";
}

// Diferencia (minutos) entre la hora de Chile y UTC en un instante dado.
function santiagoOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

// "2026-10-10T18:30" (hora de Chile, de un input datetime-local) -> ISO UTC.
export function chileLocalToIso(value: string): string | null {
  if (!value) return null;
  const naive = new Date(`${value}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;
  const offset = santiagoOffsetMinutes(naive);
  return new Date(naive.getTime() - offset * 60000).toISOString();
}

// ISO UTC -> "2026-10-10T18:30" en hora de Chile, para un input datetime-local.
export function isoToChileLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() + santiagoOffsetMinutes(d) * 60000).toISOString().slice(0, 16);
}

// Título de un movimiento del libro para mostrar en listas.
export function txTitle(t: { type: string; note: string | null }): string {
  if (t.type === "earn") return t.note ? `Compra · ${t.note}` : "Compra";
  return t.note || TX_LABEL[t.type];
}
