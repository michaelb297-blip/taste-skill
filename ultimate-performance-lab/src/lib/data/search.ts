import type { Vehicle } from "../types";
import { BRANDS, BRAND_ALIASES } from "./brands";
import { VEHICLES } from "./vehicles";

export interface ParsedQuery {
  raw: string;
  brand?: string;
  year?: number;
  ps?: number;
  kw?: number;
  drive?: Vehicle["drive"];
  fuel?: Vehicle["engine"]["fuel"];
  tokens: string[];
}

export interface SearchHit {
  vehicle: Vehicle;
  score: number;
  /** Warum der Treffer passt bzw. wo er abweicht */
  remarks: string[];
}

export interface SearchResult {
  parsed: ParsedQuery;
  hits: SearchHit[];
  /** Baureihen aus dem Markenverzeichnis ohne technischen Datensatz */
  catalogOnly: { brand: string; model: string }[];
  hints: string[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.+# ]+/g, " ").replace(/\s+/g, " ").trim();

const BRAND_LOOKUP: [string, string][] = [
  ...BRANDS.map((b) => [norm(b.name), b.name] as [string, string]),
  ...Object.entries(BRAND_ALIASES).map(([k, v]) => [norm(k), v] as [string, string]),
].sort((a, b) => b[0].length - a[0].length);

/** Zerlegt eine Freitextanfrage wie "BMW G22 2022 430i 249 PS". */
export function parseQuery(raw: string): ParsedQuery {
  let q = ` ${norm(raw)} `;
  const parsed: ParsedQuery = { raw, tokens: [] };

  for (const [key, name] of BRAND_LOOKUP) {
    if (q.includes(` ${key} `)) {
      parsed.brand = name;
      q = q.replace(` ${key} `, " ");
      break;
    }
  }

  const ps = q.match(/ (\d{2,4}) ?(ps|hp|bhp|cv|pk) /);
  if (ps) {
    parsed.ps = Number(ps[1]);
    q = q.replace(ps[0], " ");
  }
  const kw = q.match(/ (\d{2,4}) ?kw /);
  if (kw) {
    parsed.kw = Number(kw[1]);
    q = q.replace(kw[0], " ");
  }
  const year = q.match(/ (19[5-9]\d|20[0-4]\d) /);
  if (year) {
    parsed.year = Number(year[1]);
    q = q.replace(year[0], " ");
  }
  if (/ (xdrive|quattro|4matic|4motion|awd|allrad|4x4|4drive) /.test(q)) parsed.drive = "AWD";
  else if (/ (heckantrieb|hinterradantrieb|rwd|sdrive) /.test(q)) parsed.drive = "RWD";
  else if (/ (frontantrieb|vorderradantrieb|fwd) /.test(q)) parsed.drive = "FWD";
  if (/ (diesel|tdi|cdi|hdi) /.test(q)) parsed.fuel = "diesel";
  else if (/ (elektro|electric|ev|elektrisch) /.test(q)) parsed.fuel = "electric";

  parsed.tokens = q.trim().split(" ").filter((t) => t.length > 0 && !["der", "die", "das", "mit", "und", "baujahr", "bj"].includes(t));
  return parsed;
}

function haystack(v: Vehicle): string {
  return norm(
    [v.brand, v.model, v.generation, v.variant, v.engine.code, v.engine.name, v.engine.family, v.gearbox.name, v.body, v.drive === "AWD" ? "xdrive quattro 4matic awd allrad" : ""]
      .filter(Boolean)
      .join(" "),
  );
}

export function searchVehicles(raw: string, limit = 12): SearchResult {
  const parsed = parseQuery(raw);
  const hints: string[] = [];
  const hits: SearchHit[] = [];
  const thisYear = new Date().getFullYear();

  for (const v of VEHICLES) {
    let score = 0;
    const remarks: string[] = [];
    if (parsed.brand) {
      if (v.brand !== parsed.brand) continue;
      score += 4;
    }
    const hay = ` ${haystack(v)} `;
    let tokenHits = 0;
    for (const t of parsed.tokens) {
      if (hay.includes(` ${t} `)) {
        score += 5;
        tokenHits++;
      } else if (t.length >= 3 && hay.includes(t)) {
        score += 2.5;
        tokenHits++;
      }
    }
    if (parsed.tokens.length > 0 && tokenHits === 0) continue;
    if (!parsed.brand && parsed.tokens.length === 0 && !parsed.ps && !parsed.kw && !parsed.year) continue;

    if (parsed.year) {
      if (parsed.year >= v.yearFrom && parsed.year <= (v.yearTo ?? thisYear)) score += 4;
      else {
        score -= 2;
        remarks.push(`Baujahr ${parsed.year} liegt außerhalb der Bauzeit (${v.yearFrom}–${v.yearTo ?? "heute"})`);
      }
    }
    const wantPs = parsed.ps ?? (parsed.kw ? Math.round(parsed.kw * 1.35962) : undefined);
    if (wantPs) {
      const diff = Math.abs(v.power.ps - wantPs) / wantPs;
      if (diff === 0) score += 5;
      else if (diff <= 0.06) {
        score += 3;
        remarks.push(`${wantPs} PS nicht belegt – nächstliegende Angabe: ${v.power.ps} PS`);
      } else score -= 3;
    }
    if (parsed.drive) score += v.drive === parsed.drive ? 3 : -1;
    if (parsed.fuel) score += v.engine.fuel === parsed.fuel ? 3 : -3;
    if (score > 0) hits.push({ vehicle: v, score, remarks });
  }
  hits.sort((a, b) => b.score - a.score || a.vehicle.yearFrom - b.vehicle.yearFrom);

  const catalogOnly: { brand: string; model: string }[] = [];
  const brandPool = parsed.brand ? BRANDS.filter((b) => b.name === parsed.brand) : BRANDS;
  for (const b of brandPool) {
    for (const m of b.models) {
      const mn = norm(m);
      const hit = parsed.tokens.some((t) => mn === t || (t.length >= 3 && mn.split(" ").includes(t)));
      if ((hit || (parsed.brand && parsed.tokens.length === 0)) && !VEHICLES.some((v) => v.brand === b.name && v.model === m)) {
        catalogOnly.push({ brand: b.name, model: m });
      }
    }
  }

  if (hits.length === 0 && catalogOnly.length === 0 && raw.trim()) {
    hints.push("Kein Treffer im lokalen Katalog. Du kannst das Fahrzeug mit eigenen Daten anlegen oder die Live-Recherche nutzen.");
  }
  const top = hits[0];
  if (top) for (const r of top.remarks) hints.push(r);

  return { parsed, hits: hits.slice(0, limit), catalogOnly: catalogOnly.slice(0, 12), hints };
}
