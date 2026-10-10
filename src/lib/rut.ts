// RUT chileno: normalización y dígito verificador (módulo 11).
export function normalizeRut(input: string): string {
  const clean = input.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export function isValidRut(input: string): boolean {
  const rut = normalizeRut(input);
  if (!/^\d{6,8}-[\dK]$/.test(rut)) return false;
  const [body, dv] = rut.split("-");
  let total = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    total += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const r = 11 - (total % 11);
  const expected = r === 11 ? "0" : r === 10 ? "K" : String(r);
  return dv === expected;
}

// 12345678-5 -> 12.345.678-5
export function formatRut(rut: string): string {
  const [body, dv] = normalizeRut(rut).split("-");
  if (!dv) return rut;
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}
