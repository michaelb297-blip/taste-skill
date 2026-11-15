import type { Vehicle } from "../types";
import type { EngineKind } from "./families";

/** Leistung in PS aus Drehmoment (Nm) und Drehzahl (1/min). */
export const psFrom = (nm: number, rpm: number) => (nm * rpm) / 7023.5;
export const PS_PER_KW = 1.35962;

export interface CurveSpec {
  kind: EngineKind;
  ps: number;
  nm: number;
  /** Beginn des Drehmomentplateaus (Turbo) bzw. Drehzahl des Maximums (Sauger) */
  rpmTq: number;
  /** Drehzahl der maximalen Leistung */
  rpmP: number;
  /** Ende des Leistungsplateaus */
  rpmP2: number;
  redline: number;
  idle: number;
  /** true = Drehzahlen sind Annahmen, keine Herstellerangaben */
  assumed: boolean;
}

export interface CurvePoint {
  rpm: number;
  nm: number;
  ps: number;
}

const DEFAULTS: Record<EngineKind, { tq: number; p: number; p2: number; red: number }> = {
  "turbo-petrol": { tq: 1900, p: 5500, p2: 6200, red: 6800 },
  phev: { tq: 1700, p: 5200, p2: 6000, red: 6500 },
  "turbo-diesel": { tq: 1750, p: 3800, p2: 4000, red: 5000 },
  "na-petrol": { tq: 4500, p: 6500, p2: 6500, red: 7000 },
  "sc-petrol": { tq: 4000, p: 6200, p2: 6200, red: 6600 },
  hev: { tq: 4000, p: 5500, p2: 6000, red: 6200 },
  ev: { tq: 0, p: 5000, p2: 12000, red: 16000 },
  fcev: { tq: 0, p: 4500, p2: 10000, red: 13000 },
};

/** Kennlinien-Eckdaten aus Fahrzeugdaten; fehlende Drehzahlen werden als Annahme ergänzt. */
export function curveSpec(v: Vehicle, kind: EngineKind, ps: number, nm: number, chargerTier = 0): CurveSpec {
  const d = DEFAULTS[kind];
  const forced = kind === "turbo-petrol" || kind === "turbo-diesel" || kind === "phev";
  const assumed = v.power.rpmFrom == null || v.torque.rpmFrom == null || v.engine.redline == null;
  let rpmTq = v.torque.rpmFrom ?? d.tq;
  const rpmP = v.power.rpmFrom ?? d.p;
  let rpmP2 = Math.max(rpmP, v.power.rpmTo ?? d.p2);
  let redline = v.engine.redline ?? Math.max(d.red, rpmP2 + 300);
  if (kind === "ev" || kind === "fcev") {
    // Elektromaschine: Eckdrehzahl folgt aus Leistung und Drehmoment
    redline = d.red;
    const base = (ps * 7023.5) / nm;
    return { kind, ps, nm, rpmTq: 0, rpmP: base, rpmP2: redline * 0.8, redline, idle: 0, assumed: true };
  }
  if (forced) {
    // größere Lader sprechen später an und tragen die Leistung weiter nach oben
    rpmTq += chargerTier === 1 ? 300 : chargerTier === 2 ? 900 : 0;
    if (chargerTier === 2) rpmP2 = Math.min(redline - 100, rpmP2 + 300);
  } else if (chargerTier > 0) {
    // Saugmotor mit schärferen Nockenwellen dreht höher
    redline += chargerTier * 300;
    rpmP2 += chargerTier * 250;
  }
  return { kind, ps, nm, rpmTq, rpmP, rpmP2: Math.max(rpmP2, rpmP), redline, idle: 1000, assumed };
}

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Volllast-Drehmoment (Nm) bei gegebener Drehzahl. */
export function torqueAt(s: CurveSpec, rpm: number): number {
  const r = Math.max(rpm, s.idle || 1);
  if (s.kind === "ev" || s.kind === "fcev") {
    const pCap = r <= s.rpmP2 ? s.ps : s.ps * (1 - 0.15 * ((r - s.rpmP2) / (s.redline - s.rpmP2)));
    return Math.min(s.nm, (pCap * 7023.5) / r);
  }
  const forced = s.kind === "turbo-petrol" || s.kind === "turbo-diesel" || s.kind === "phev";
  if (forced) {
    const spool = r >= s.rpmTq ? 1 : 0.42 + 0.58 * smooth((r - s.idle) / (s.rpmTq - s.idle));
    const tA = s.nm * spool;
    const fall = r <= s.rpmP2 ? 1 : 1 - 0.14 * Math.pow((r - s.rpmP2) / Math.max(200, s.redline - s.rpmP2), 1.4);
    const tB = (s.ps * fall * 7023.5) / r;
    return Math.min(tA, tB);
  }
  // Saug- und Kompressormotor: Parabel um das Drehmomentmaximum
  const rpmT = Math.min(s.rpmTq, s.rpmP - 500);
  const tP = (s.ps * 7023.5) / s.rpmP;
  if (r <= rpmT) return s.nm * (1 - 0.24 * Math.pow((rpmT - r) / (rpmT - s.idle), 2));
  if (r <= s.rpmP) return s.nm - (s.nm - tP) * Math.pow((r - rpmT) / (s.rpmP - rpmT), 2);
  // jenseits der Nennleistung fällt die Leistung ab
  const fall = 1 - 0.1 * Math.pow((r - s.rpmP) / Math.max(200, s.redline - s.rpmP), 1.5);
  return (s.ps * fall * 7023.5) / r;
}

/** Tabellierte Kennlinie für Diagramme. */
export function buildCurve(s: CurveSpec, step = 100): CurvePoint[] {
  const pts: CurvePoint[] = [];
  const start = s.kind === "ev" || s.kind === "fcev" ? 0 : s.idle;
  const stepSize = s.kind === "ev" || s.kind === "fcev" ? 250 : step;
  for (let rpm = start; rpm <= s.redline + 1e-6; rpm += stepSize) {
    const nm = torqueAt(s, rpm);
    pts.push({ rpm, nm: Math.round(nm * 10) / 10, ps: Math.round(psFrom(nm, rpm) * 10) / 10 });
  }
  return pts;
}
