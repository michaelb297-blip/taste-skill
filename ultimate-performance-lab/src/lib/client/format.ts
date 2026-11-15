export const nf = (x: number | null | undefined, digits = 0): string =>
  x == null || Number.isNaN(x) ? "–" : x.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const euro = (x: number): string => `${Math.round(x).toLocaleString("de-DE")} €`;
export const euroRange = (r: [number, number]): string => (r[1] === 0 ? "–" : r[0] === r[1] ? euro(r[0]) : `${Math.round(r[0]).toLocaleString("de-DE")}–${euro(r[1])}`);

export const signed = (x: number, digits = 0): string => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${nf(Math.abs(x), digits)}`;

export const dateDe = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};
