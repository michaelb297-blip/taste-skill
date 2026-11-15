import type { Vehicle } from "../types";
import { torqueAt, type CurveSpec } from "./curves";

/** Längsdynamik-Simulation: Zugkraft über Gänge, Traktion, Fahrwiderstände. */

const G = 9.81;
const RHO = 1.2;

const BODY_AERO: Record<Vehicle["body"], { cd: number; area: number; hl: number }> = {
  coupe: { cd: 0.29, area: 2.15, hl: 0.19 },
  sedan: { cd: 0.28, area: 2.22, hl: 0.2 },
  hatch: { cd: 0.31, area: 2.2, hl: 0.21 },
  wagon: { cd: 0.3, area: 2.28, hl: 0.21 },
  suv: { cd: 0.34, area: 2.65, hl: 0.26 },
  roadster: { cd: 0.33, area: 1.95, hl: 0.19 },
  supercar: { cd: 0.33, area: 2.0, hl: 0.16 },
  pickup: { cd: 0.4, area: 3.0, hl: 0.28 },
};

export interface Strategy {
  torqueTau: number;
  shiftTimeMul: number;
  shiftFrac: number;
  launchMul: number;
}
export const BEST_STRATEGY: Strategy = { torqueTau: 0.05, shiftTimeMul: 0.75, shiftFrac: 1, launchMul: 1 };

export interface Chassis {
  massKg: number;
  cdA: number;
  crr: number;
  mu: number;
  /** maximale Zugkraft der angetriebenen Achse(n) in N */
  tractionN: number;
  tyreR: number;
  eta: number;
  /** Gesamtübersetzungen je Gang (Gang × Achse); leer = Leistungshalte-Modell */
  overall: number[];
  shiftTime: number;
  shiftFill: number;
  /** Zugkraftgrenze bei niedriger Geschwindigkeit im Leistungshalte-Modell (N) */
  holdForceN: number;
  assumptions: string[];
}

export function tyreRadius(spec: string | undefined, body: Vehicle["body"]): { r: number; assumed: boolean } {
  const m = spec?.match(/(\d{3})\/(\d{2})\s*Z?R\s*(\d{2})/i);
  if (m) return { r: (((Number(m[3]) * 25.4) / 2 + Number(m[1]) * (Number(m[2]) / 100)) / 1000) * 0.97, assumed: false };
  return { r: body === "suv" || body === "pickup" ? 0.36 : body === "hatch" || body === "roadster" ? 0.315 : 0.33, assumed: true };
}

export function defaultCdA(v: Vehicle): { cdA: number; assumed: boolean } {
  const b = BODY_AERO[v.body];
  return { cdA: (v.aero?.cd ?? b.cd) * (v.aero?.areaM2 ?? b.area), assumed: v.aero?.cd == null || v.aero?.areaM2 == null };
}

export function resist(c: Chassis, ms: number): number {
  return c.massKg * G * c.crr * (1 + (ms * ms) / 9000) + 0.5 * RHO * c.cdA * ms * ms;
}

/** Leistungsbegrenzte Höchstgeschwindigkeit ohne Übersetzungsgrenze (km/h). */
export function powerLimitedVmax(psWheel: number, c: Pick<Chassis, "massKg" | "cdA" | "crr">): number {
  const p = psWheel * 735.5;
  let lo = 10;
  let hi = 150;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const need = (c.massKg * G * c.crr * (1 + (mid * mid) / 9000) + 0.5 * RHO * c.cdA * mid * mid) * mid;
    if (need > p) hi = mid;
    else lo = mid;
  }
  return lo * 3.6;
}

export function buildChassis(v: Vehicle, opts: { cdA?: number; muFactor?: number; massDeltaKg?: number; vmaxRef?: number } = {}): Chassis {
  const assumptions: string[] = [];
  const driver = v.weightBasis === "DIN" ? 75 : 0;
  if (v.weightBasis == null) assumptions.push("Messbasis des Leergewichts unbekannt – es wird ohne Fahrerzuschlag gerechnet.");
  const massKg = v.weightKg + driver + (opts.massDeltaKg ?? 0);
  const aero = defaultCdA(v);
  const cdA = opts.cdA ?? aero.cdA;
  if (aero.assumed && opts.cdA == null) assumptions.push(`Luftwiderstand: cW·A = ${aero.cdA.toFixed(2)} m² (Annahme nach Karosserieform${v.aero?.cd ? ", cW belegt" : ""}).`);
  const tyre = tyreRadius(v.drive === "FWD" ? v.tyres?.front : (v.tyres?.rear ?? v.tyres?.front), v.body);
  if (tyre.assumed) assumptions.push(`Dynamischer Reifenhalbmesser ${tyre.r.toFixed(3)} m (Annahme, Reifengröße nicht hinterlegt).`);
  const psPerTon = v.power.ps / (massKg / 1000);
  const mu = (1.1 + Math.min(0.2, Math.max(0, (psPerTon - 150) / 1000))) * (opts.muFactor ?? 1);
  const hl = BODY_AERO[v.body].hl;
  const pos = v.engine.position ?? "front";
  let tractionN: number;
  if (v.drive === "AWD") tractionN = mu * massKg * G * 0.97;
  else if (v.drive === "RWD") {
    const wr = pos === "rear" ? 0.62 : pos === "mid" ? 0.58 : 0.49;
    tractionN = (mu * massKg * G * wr) / (1 - mu * hl);
  } else tractionN = (mu * massKg * G * 0.61) / (1 + mu * hl);

  const t = v.gearbox.type;
  const eta = (t === "manual" ? 0.92 : t === "dct" ? 0.91 : t === "automatic" ? 0.9 : t === "cvt" ? 0.87 : 0.93) - (v.drive === "AWD" ? 0.03 : 0);
  const shiftTime = t === "manual" ? 0.45 : t === "dct" ? 0.1 : 0.22;
  const shiftFill = t === "manual" ? 0 : t === "dct" ? 0.6 : 0.35;
  const redline = v.engine.redline ?? 6800;
  let overall: number[] = [];
  let holdForceN = Number.POSITIVE_INFINITY;

  if (t === "single-speed" || t === "cvt") {
    if (t === "single-speed") {
      // feste Übersetzung: so angenommen, dass die Maschine bei Vmax nahe ihrer Höchstdrehzahl läuft
      const vref = (v.performance.vmax ?? opts.vmaxRef ?? 200) / 3.6;
      const ratio = (16000 * 0.92) / ((vref / (2 * Math.PI * tyre.r)) * 60);
      holdForceN = (v.torque.nm * ratio * eta) / tyre.r;
      assumptions.push(`Feste Übersetzung ≈ ${ratio.toFixed(1)}:1 (Annahme aus Höchstgeschwindigkeit und 16.000/min Maschinendrehzahl).`);
    } else assumptions.push("Stufenloses Getriebe: Der Antrieb hält die Nennleistung; die Zugkraft folgt P/v.");
  } else if (v.gearbox.ratios && v.gearbox.finalDrive) {
    overall = v.gearbox.ratios.map((r) => r * v.gearbox.finalDrive!);
  } else {
    const n = v.gearbox.gears;
    const vref = opts.vmaxRef ?? v.performance.vmax ?? 220;
    const wheelRpmAt = (kmh: number) => (kmh / 3.6 / (2 * Math.PI * tyre.r)) * 60;
    const topGear = n >= 8 ? n - 2 : n === 7 ? n - 1 : n;
    const rpmAtVmax = Math.min(redline * 0.95, (v.power.rpmTo ?? v.power.rpmFrom ?? redline * 0.9) * 1.02);
    const rTop = rpmAtVmax / wheelRpmAt(vref * 1.03);
    if (v.gearbox.ratios) {
      // Stufung bekannt, Achsübersetzung nicht: aus der Höchstgeschwindigkeit ableiten
      const fd = rTop / v.gearbox.ratios[topGear - 1];
      overall = v.gearbox.ratios.map((r) => r * fd);
      assumptions.push(`Achsübersetzung ≈ ${fd.toFixed(2)} (Annahme, abgeleitet aus Höchstgeschwindigkeit und belegter Gangstufung).`);
    } else {
      const v1 = Math.min(85, Math.max(45, 42 + 0.05 * v.power.ps));
      const r1 = redline / wheelRpmAt(v1);
      const q = Math.pow(rTop / r1, 1 / Math.max(1, topGear - 1));
      for (let g = 1; g <= n; g++) overall.push(g <= topGear ? r1 * Math.pow(q, g - 1) : rTop * Math.pow(0.8, g - topGear));
      assumptions.push(`Getriebeübersetzungen nicht hinterlegt – ${n} Gänge geometrisch gestuft (1. Gang bis ca. ${Math.round(v1)} km/h, Höchstgeschwindigkeit im ${topGear}. Gang).`);
    }
  }
  return { massKg, cdA, crr: 0.0115, mu, tractionN, tyreR: tyre.r, eta, overall, shiftTime, shiftFill, holdForceN, assumptions };
}

const rpmAt = (c: Chassis, gear: number, ms: number) => (ms / (2 * Math.PI * c.tyreR)) * 60 * c.overall[gear];

function driveForce(c: Chassis, s: CurveSpec, gear: number, ms: number, launchRpm: number): { f: number; rpm: number } {
  if (c.overall.length === 0) {
    const p = s.ps * 735.5 * c.eta;
    return { f: Math.min(c.holdForceN, p / Math.max(ms, 3)), rpm: 0 };
  }
  const rpm = Math.max(rpmAt(c, gear, ms), gear === 0 ? launchRpm : s.idle);
  if (rpm > s.redline) return { f: 0, rpm };
  return { f: (torqueAt(s, rpm) * c.overall[gear] * c.eta) / c.tyreR, rpm };
}

function shiftPoints(c: Chassis, s: CurveSpec, frac: number): number[] {
  const pts: number[] = [];
  for (let g = 0; g < c.overall.length - 1; g++) {
    let shift = s.redline - 50;
    for (let rpm = Math.max(s.rpmTq, 2500); rpm < s.redline - 50; rpm += 50) {
      const next = rpm * (c.overall[g + 1] / c.overall[g]);
      if (torqueAt(s, next) * c.overall[g + 1] > torqueAt(s, rpm) * c.overall[g]) {
        shift = rpm;
        break;
      }
    }
    pts.push(Math.max(s.rpmTq + 500, shift * frac));
  }
  return pts;
}

export interface AccelResult {
  t100: number | null;
  t200: number | null;
  t80120: number | null;
}

function run(c: Chassis, s: CurveSpec, st: Strategy, fromKmh: number, marks: number[], maxT: number): (number | null)[] {
  const dt = 0.004;
  const shifts = shiftPoints(c, s, st.shiftFrac);
  const launchRpm = Math.min(s.redline * 0.7, Math.max(s.rpmTq + 400, 2800)) * st.launchMul;
  let ms = fromKmh / 3.6;
  let gear = 0;
  if (c.overall.length) {
    // niedrigster Gang, der bei der Startgeschwindigkeit nicht überdreht (Kickdown)
    while (gear < c.overall.length - 1 && rpmAt(c, gear, ms) > (shifts[gear] ?? s.redline) * 0.97) gear++;
  }
  const out: (number | null)[] = marks.map(() => null);
  let t = 0;
  let shiftLeft = 0;
  let sinceEvent = 0;
  let idx = 0;
  const startKmh = fromKmh;
  while (t < maxT && idx < marks.length) {
    let { f, rpm } = driveForce(c, s, gear, ms, launchRpm);
    const inShift = shiftLeft > 0;
    if (inShift) {
      f *= c.shiftFill;
      shiftLeft -= dt;
    } else {
      f *= 1 - Math.exp(-(sinceEvent + dt) / st.torqueTau);
      if (c.overall.length && gear < c.overall.length - 1 && rpm >= shifts[gear]) {
        gear++;
        shiftLeft = c.shiftTime * st.shiftTimeMul;
        sinceEvent = startKmh > 0 ? 0.3 : 0.15;
      }
    }
    // Drehende Massen zehren am Motormoment, nicht an der übertragbaren Reifenkraft
    const delta = c.overall.length ? 1.04 + 0.0018 * c.overall[gear] * c.overall[gear] : 1.05;
    const res = resist(c, ms);
    const a = Math.min((f - res) / (c.massKg * delta), (c.tractionN - res) / (c.massKg * 1.03));
    ms = Math.max(0, ms + a * dt);
    t += dt;
    sinceEvent += dt;
    while (idx < marks.length && ms * 3.6 >= marks[idx]) out[idx++] = t;
    if (a <= 0.01 && ms > 5 && !inShift && t > 3) break;
  }
  return out;
}

export function accelerate(c: Chassis, s: CurveSpec, st: Strategy = BEST_STRATEGY): AccelResult {
  const [t100, t200] = run(c, s, st, 0, [100, 200], 90);
  const [t120] = run(c, s, st, 80, [120], 40);
  return { t100, t200: t200 != null && t100 != null ? t200 : null, t80120: t120 };
}

/** Physikalische Höchstgeschwindigkeit in km/h (ohne elektronische Begrenzung). */
export function topSpeed(c: Chassis, s: CurveSpec): number {
  let best = 0;
  for (let kmh = 60; kmh <= 480; kmh += 0.5) {
    const ms = kmh / 3.6;
    const need = resist(c, ms);
    let ok = false;
    if (c.overall.length === 0) ok = Math.min(c.holdForceN, (s.ps * 735.5 * c.eta) / ms) >= need;
    else
      for (let g = 0; g < c.overall.length; g++) {
        const rpm = rpmAt(c, g, ms);
        if (rpm < s.idle || rpm > s.redline) continue;
        if ((torqueAt(s, rpm) * c.overall[g] * c.eta) / c.tyreR >= need) {
          ok = true;
          break;
        }
      }
    if (ok) best = kmh;
    else if (best > 0 && kmh > best + 40) break;
  }
  return best;
}
