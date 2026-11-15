import type { Vehicle } from "../types";
import { BRANDS, slugify, type BrandEntry } from "./brands";
import { VEHICLES } from "./vehicles";

const BY_ID = new Map(VEHICLES.map((v) => [v.id, v]));

export function getVehicle(id: string): Vehicle | undefined {
  return BY_ID.get(id);
}

export function allVehicles(): Vehicle[] {
  return VEHICLES;
}

export function vehicleTitle(v: Vehicle): string {
  return `${v.brand} ${v.variant}`.replace(new RegExp(`^${v.brand} ${v.brand}`), v.brand);
}

export function vehicleSubtitle(v: Vehicle): string {
  const years = v.yearTo ? `${v.yearFrom}–${v.yearTo}` : `seit ${v.yearFrom}`;
  return `${v.generation} · ${years} · ${v.power.ps} PS · ${driveLabel(v.drive)}`;
}

export function driveLabel(d: Vehicle["drive"]): string {
  return d === "AWD" ? "Allradantrieb" : d === "RWD" ? "Hinterradantrieb" : "Vorderradantrieb";
}

export function gearboxLabel(v: Vehicle): string {
  const t = v.gearbox.type;
  const base =
    t === "manual" ? "Schaltgetriebe" : t === "automatic" ? "Wandlerautomatik" : t === "dct" ? "Doppelkupplungsgetriebe" : t === "cvt" ? "Stufenloses Getriebe" : "Feste Übersetzung";
  return t === "single-speed" && v.gearbox.gears <= 1 ? base : `${v.gearbox.gears}-Gang ${base}`;
}

export interface BrandSummary extends BrandEntry {
  /** Anzahl vollständig spezifizierter Varianten */
  variantCount: number;
  /** Baureihen, für die technische Datensätze vorliegen */
  modelsWithData: string[];
}

export function brandSummaries(): BrandSummary[] {
  return BRANDS.map((b) => {
    const vs = VEHICLES.filter((v) => v.brand === b.name);
    return { ...b, variantCount: vs.length, modelsWithData: [...new Set(vs.map((v) => v.model))] };
  });
}

export function getBrand(id: string): BrandSummary | undefined {
  return brandSummaries().find((b) => b.id === id);
}

/** Baureihen einer Marke: Verzeichnisnamen plus Baureihen aus Datensätzen. */
export function modelsOfBrand(brandName: string): { name: string; variantCount: number }[] {
  const b = BRANDS.find((x) => x.name === brandName);
  const names = new Set<string>(b?.models ?? []);
  for (const v of VEHICLES) if (v.brand === brandName) names.add(v.model);
  return [...names].map((name) => ({
    name,
    variantCount: VEHICLES.filter((v) => v.brand === brandName && v.model === name).length,
  }));
}

export type SelectionStep = "brand" | "model" | "generation" | "year" | "variant" | "gearbox" | "drive";
export interface Selection {
  brand?: string;
  model?: string;
  generation?: string;
  year?: number;
  variant?: string;
  gearbox?: string;
  drive?: string;
}

function matches(v: Vehicle, s: Selection): boolean {
  if (s.brand && v.brand !== s.brand) return false;
  if (s.model && v.model !== s.model) return false;
  if (s.generation && v.generation !== s.generation) return false;
  if (s.year && (s.year < v.yearFrom || s.year > (v.yearTo ?? new Date().getFullYear()))) return false;
  if (s.variant && variantKey(v) !== s.variant) return false;
  if (s.gearbox && gearboxLabel(v) !== s.gearbox) return false;
  if (s.drive && v.drive !== s.drive) return false;
  return true;
}

/** Motorisierung als eigener Auswahlschritt: Bezeichnung plus Leistung. */
export function variantKey(v: Vehicle): string {
  return `${v.variant} · ${v.power.ps} PS`;
}

/** Mehrstufige Auswahl: liefert die Optionen des nächsten Schritts. */
export function selectionOptions(s: Selection): { step: SelectionStep | "done"; options: string[]; matches: Vehicle[] } {
  const pool = VEHICLES.filter((v) => matches(v, s));
  const uniq = (xs: string[]) => [...new Set(xs)];
  if (!s.brand) return { step: "brand", options: BRANDS.map((b) => b.name), matches: pool };
  if (!s.model) return { step: "model", options: modelsOfBrand(s.brand).map((m) => m.name), matches: pool };
  if (!s.generation) return { step: "generation", options: uniq(pool.map((v) => v.generation)), matches: pool };
  if (!s.year) {
    const years = new Set<number>();
    const now = new Date().getFullYear();
    for (const v of pool) for (let y = v.yearFrom; y <= (v.yearTo ?? now); y++) years.add(y);
    return { step: "year", options: [...years].sort((a, b) => b - a).map(String), matches: pool };
  }
  if (!s.variant) return { step: "variant", options: uniq(pool.map(variantKey)), matches: pool };
  if (!s.gearbox) return { step: "gearbox", options: uniq(pool.map(gearboxLabel)), matches: pool };
  if (!s.drive) return { step: "drive", options: uniq(pool.map((v) => v.drive)), matches: pool };
  return { step: "done", options: [], matches: pool };
}

export { slugify };
