import { PROFILE_ORDER, STAGE_LABEL, STAGE_ORDER, type Basis, type Confidence, type ProfileId, type Provenance, type StageId, type Vehicle } from "../types";
import { buildCurve, curveSpec, type CurvePoint, type CurveSpec } from "./curves";
import { evaluateConfig, stageConfig, STAGE_DESCRIPTION, type Config, type Evaluation } from "./components";
import { resolveTuning, type TuningModel } from "./families";
import { accelerate, BEST_STRATEGY, buildChassis, defaultCdA, powerLimitedVmax, topSpeed, type Chassis, type Strategy } from "./physics";
import { PROFILES } from "./profiles";

export interface Metric {
  value: number | null;
  lo?: number;
  hi?: number;
  prov: Provenance;
  note?: string;
}

export interface StageResult {
  stage: StageId | "custom";
  label: string;
  description: string;
  config: Config;
  ps: number;
  kw: number;
  nm: number;
  psRange: [number, number];
  psProv: Provenance;
  gainPct: number;
  nmGainPct: number;
  psPerTon: number;
  wheelPs: number;
  acc0100: Metric;
  acc100200: Metric;
  acc80120: Metric;
  /** Höchstgeschwindigkeit mit Serien-Begrenzer (falls vorhanden) */
  vmax: Metric;
  /** physikalisch mögliche Höchstgeschwindigkeit ohne Begrenzer */
  vmaxUnlimited: Metric;
  consumption: Metric | null;
  consumptionUnit: string;
  rangeKm: Metric | null;
  evaluation: Evaluation;
  curve: CurvePoint[];
  spec: CurveSpec;
  basis: Basis;
  confidence: Confidence;
}

export interface ProfileResult {
  profile: ProfileId;
  acc0100: number | null;
  acc80120: number | null;
  acc100200: number | null;
  consumption: number | null;
  thermal: number;
}

export interface Simulation {
  vehicle: Vehicle;
  model: TuningModel;
  stages: Record<StageId, StageResult>;
  assumptions: string[];
  calibration: { offset0100: number; k100200: number; cdA: number; cdACalibrated: boolean; vmaxRef: number };
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

interface Ctx {
  v: Vehicle;
  model: TuningModel;
  cdA: number;
  vmaxRef: number;
  offset: number;
  /** Skalierung, falls die additive Korrektur allein nicht ausreicht */
  k100: number;
  k200: number;
}

function chassisFor(c: Ctx, e: Evaluation): Chassis {
  return buildChassis(c.v, { cdA: c.cdA, muFactor: e.muFactor, massDeltaKg: e.massDeltaKg, vmaxRef: c.vmaxRef });
}

function timesFor(c: Ctx, ch: Chassis, spec: CurveSpec, st: Strategy = BEST_STRATEGY) {
  const a = accelerate(ch, spec, st);
  const t100 = a.t100 == null ? null : Math.max(a.t100 * 0.6, (a.t100 + c.offset) * c.k100, 1.6);
  const t100200 = a.t100 != null && a.t200 != null ? (a.t200 - a.t100) * c.k200 : null;
  const t80120 = a.t80120 == null ? null : a.t80120 * Math.sqrt(c.k200);
  return { t100, t100200, t80120 };
}

function consumptionFactor(model: TuningModel, e: Evaluation, v: Vehicle): number {
  if (model.kind === "ev" || model.kind === "hev" || model.kind === "fcev") return e.muFactor > 1 ? 1.04 : 1;
  const gain = e.ps / v.power.ps - 1;
  let f = 1 + 0.1 * gain + (e.chargerTier >= 1 ? 0.05 : 0) + (e.chargerTier >= 2 ? 0.08 : 0);
  if (model.kind === "turbo-diesel" && e.chargerTier === 0 && gain > 0) f -= 0.03;
  return f;
}

function build(c: Ctx, stage: StageId | "custom", cfg: Config, label: string, description: string, psRangeIn?: [number, number]): StageResult {
  const { v, model } = c;
  const e = evaluateConfig(v, model, cfg);
  const isStock = e.ps === v.power.ps && e.nm === v.torque.nm && e.muFactor === 1 && e.massDeltaKg === 0;
  const spec = curveSpec(v, model.kind, e.ps, e.nm, e.chargerTier);
  const ch = chassisFor(c, e);
  const t = timesFor(c, ch, spec);

  // Unsicherheitsspanne: Leistungsspanne der Stufe plus Modellunsicherheit
  const psRange: [number, number] = psRangeIn && e.ps > v.power.ps ? [Math.min(psRangeIn[0], e.ps), Math.max(psRangeIn[1], e.ps)] : [e.ps, e.ps];
  const variant = (ps: number) => timesFor(c, ch, curveSpec(v, model.kind, ps, Math.max(v.torque.nm, e.nm * (ps / e.ps)), e.chargerTier));
  const fast = psRange[1] > e.ps ? variant(psRange[1]) : t;
  const slow = psRange[0] < e.ps ? variant(psRange[0]) : t;
  const u = isStock && v.performance.acc0100 ? 0.03 : model.confidence === "hoch" ? 0.04 : model.confidence === "mittel" ? 0.05 : 0.07;
  const metric = (val: number | null, lo: number | null, hi: number | null, prov: Provenance, note?: string): Metric =>
    val == null ? { value: null, prov, note: note ?? "In der Simulation nicht erreicht." } : { value: r1(val), lo: r1((lo ?? val) * (1 - u)), hi: r1((hi ?? val) * (1 + u)), prov, note };

  const stockAcc = isStock && v.performance.acc0100 != null;
  const acc0100 = stockAcc ? { value: v.performance.acc0100!, prov: "katalog" as Provenance, note: "Herstellerangabe" } : metric(t.t100, fast.t100, slow.t100, "simuliert");
  const stock200 = isStock && v.performance.acc100200 != null;
  const acc100200 = stock200 ? { value: v.performance.acc100200!, prov: "katalog" as Provenance, note: "Aus Herstellerangabe abgeleitet" } : metric(t.t100200, fast.t100200, slow.t100200, "simuliert");
  const acc80120 = metric(t.t80120, fast.t80120, slow.t80120, "simuliert", "Kickdown im jeweils günstigsten Gang");

  let phys = Math.min(480, topSpeed(ch, spec));
  const fixedRatio = v.gearbox.type === "single-speed" && v.performance.vmax != null;
  // feste Übersetzung: Die Maschinendrehzahl begrenzt, nicht die Leistung
  if (fixedRatio) phys = Math.min(phys, v.performance.vmax!);
  const uv = 0.03;
  const limited = v.performance.vmaxLimited && v.performance.vmax != null;
  const vmaxUnlimited: Metric = { value: Math.round(phys), lo: Math.round(phys * (1 - uv)), hi: Math.round(phys * (1 + uv)), prov: "simuliert", note: fixedRatio ? "Durch Übersetzung und Maschinendrehzahl begrenzt" : "Physikalisch möglich ohne elektronische Begrenzung" };
  let vmax: Metric;
  if (isStock && v.performance.vmax != null) vmax = { value: v.performance.vmax, prov: "katalog", note: limited ? "Herstellerangabe, elektronisch begrenzt" : "Herstellerangabe" };
  else if (limited) vmax = { value: Math.min(v.performance.vmax!, Math.round(phys)), prov: phys >= v.performance.vmax! ? "katalog" : "simuliert", note: "Mit Serien-Begrenzer" };
  else vmax = vmaxUnlimited;

  const f = consumptionFactor(model, e, v);
  const consumption: Metric | null = v.consumption
    ? isStock
      ? { value: v.consumption.value, prov: "katalog", note: `Herstellerangabe (${v.consumption.cycle})` }
      : { value: r1(v.consumption.value * f), lo: r1(v.consumption.value * f * 0.93), hi: r1(v.consumption.value * f * 1.1), prov: "simuliert", note: "Schätzung bei gleicher Fahrweise" }
    : null;
  let rangeKm: Metric | null = null;
  if (v.engine.fuel === "electric" && v.consumption && (v.ev?.batteryNetKwh || v.ev?.batteryGrossKwh)) {
    const usable = v.ev.batteryNetKwh ?? v.ev.batteryGrossKwh! * 0.93;
    // WLTP-Verbrauch enthält Ladeverluste (hier mit 10 % angesetzt)
    const km = (usable / (v.consumption.value * f * 0.9)) * 100;
    rangeKm = { value: Math.round(km), lo: Math.round(km * 0.9), hi: Math.round(km * 1.05), prov: "simuliert", note: `Schätzung aus ${v.ev.batteryNetKwh ? "nutzbarer" : "Brutto-"}Batteriekapazität und Normverbrauch` };
  }

  const tuned = e.ps > v.power.ps;
  return {
    stage,
    label,
    description,
    config: cfg,
    ps: e.ps,
    kw: Math.round(e.ps / 1.35962),
    nm: e.nm,
    psRange,
    psProv: !tuned ? "katalog" : model.basis === "tunerwerte" && stage === "stage1" ? "recherchiert" : "simuliert",
    gainPct: r1((e.ps / v.power.ps - 1) * 100),
    nmGainPct: r1((e.nm / v.torque.nm - 1) * 100),
    psPerTon: Math.round(e.ps / ((v.weightKg + e.massDeltaKg) / 1000)),
    wheelPs: Math.round(e.ps * ch.eta),
    acc0100,
    acc100200,
    acc80120,
    vmax,
    vmaxUnlimited,
    consumption,
    consumptionUnit: v.consumption?.unit ?? (v.engine.fuel === "electric" ? "kWh/100km" : "l/100km"),
    rangeKm,
    evaluation: e,
    curve: buildCurve(spec),
    spec,
    basis: !tuned ? "berechnung" : stage === "stage1" || stage === "stage2" ? model.basis : model.generic ? "schaetzung" : model.basis === "tunerwerte" ? "berechnung" : model.basis,
    confidence: !tuned ? "hoch" : stage === "stage3x" ? "niedrig" : stage === "stage3s" && model.confidence === "hoch" ? "mittel" : model.confidence,
  };
}

function context(v: Vehicle): { ctx: Ctx; assumptions: string[]; cdACalibrated: boolean } {
  const model = resolveTuning(v);
  const spec = curveSpec(v, model.kind, v.power.ps, v.torque.nm, 0);
  const base = defaultCdA(v);
  const assumptions: string[] = [];
  const limited = !!v.performance.vmaxLimited;
  const mfrV = v.performance.vmax;
  const driver = v.weightBasis === "DIN" ? 75 : 0;
  const estV = powerLimitedVmax(v.power.ps * 0.9, { massKg: v.weightKg + driver, cdA: base.cdA, crr: 0.0115 });
  const vmaxRef = mfrV == null ? estV : limited ? Math.max(mfrV, estV) : mfrV;

  // Luftwiderstand an der Hersteller-Höchstgeschwindigkeit kalibrieren
  let cdA = base.cdA;
  let cdACalibrated = false;
  const vAt = (x: number) => topSpeed(buildChassis(v, { cdA: x, vmaxRef }), spec);
  if (mfrV != null && v.gearbox.type !== "single-speed") {
    const v0 = vAt(cdA);
    const target = limited ? mfrV * 1.02 : mfrV;
    if ((!limited && Math.abs(v0 - target) > 1) || (limited && v0 < target)) {
      let lo = 0.42;
      let hi = 1.4;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (vAt(mid) > target) lo = mid;
        else hi = mid;
      }
      const cal = clamp((lo + hi) / 2, base.cdA * 0.75, base.cdA * 1.3);
      if (Math.abs(cal - cdA) > 0.005) {
        cdA = cal;
        cdACalibrated = true;
        assumptions.push(`Luftwiderstand cW·A = ${cdA.toFixed(2)} m², kalibriert an der Hersteller-Höchstgeschwindigkeit (${mfrV} km/h${limited ? ", begrenzt" : ""}).`);
      }
    }
  }

  const ctx: Ctx = { v, model, cdA, vmaxRef, offset: 0, k100: 1, k200: 1 };
  const ch = buildChassis(v, { cdA, vmaxRef });
  assumptions.push(...ch.assumptions.filter((a) => !(cdACalibrated && a.startsWith("Luftwiderstand"))));
  if (spec.assumed && model.kind !== "ev" && model.kind !== "fcev") assumptions.push("Drehzahlen für Drehmoment- und Leistungsmaximum teilweise nicht hinterlegt – es werden typische Werte der Motorbauart angenommen.");
  const a = accelerate(ch, spec, BEST_STRATEGY);
  if (v.performance.acc0100 != null && a.t100 != null) {
    ctx.offset = clamp(v.performance.acc0100 - a.t100, -0.9, 1.6);
    ctx.k100 = clamp(v.performance.acc0100 / (a.t100 + ctx.offset), 0.7, 1.4);
    assumptions.push(`Beschleunigungsmodell an der Herstellerangabe 0–100 km/h (${v.performance.acc0100.toLocaleString("de-DE")} s) kalibriert: Korrektur ${ctx.offset >= 0 ? "+" : ""}${r2(ctx.offset).toLocaleString("de-DE")} s für Anfahren, Ladedruckaufbau und Reaktionszeit.`);
  } else assumptions.push("Keine Herstellerangabe für 0–100 km/h hinterlegt – die Beschleunigung ist rein simuliert und nicht kalibriert.");
  if (v.performance.acc100200 != null && a.t100 != null && a.t200 != null) {
    ctx.k200 = clamp(v.performance.acc100200 / (a.t200 - a.t100), 0.75, 1.35);
    assumptions.push(`Durchzug 100–200 km/h an der Herstellerangabe kalibriert (Faktor ${r2(ctx.k200).toLocaleString("de-DE")}).`);
  }
  assumptions.push(`Antriebsstrang-Wirkungsgrad ${Math.round(ch.eta * 100)} %, Haftreibwert μ ≈ ${ch.mu.toFixed(2)}, Rollwiderstandsbeiwert 0,0115 (Annahmen).`);
  return { ctx, assumptions, cdACalibrated };
}

export function simulateVehicle(v: Vehicle): Simulation {
  const { ctx, assumptions, cdACalibrated } = context(v);
  const { model } = ctx;
  const stages = {} as Record<StageId, StageResult>;
  for (const s of STAGE_ORDER) {
    const cfg = stageConfig(v, model, s);
    const desc = s === "stock" ? "Serienzustand laut Datensatz." : STAGE_DESCRIPTION[model.kind][s];
    stages[s] = build(ctx, s, cfg, STAGE_LABEL[s], desc, s === "stock" ? undefined : model.targets[s].psRange);
  }
  return { vehicle: v, model, stages, assumptions, calibration: { offset0100: ctx.offset, k100200: ctx.k200, cdA: ctx.cdA, cdACalibrated, vmaxRef: ctx.vmaxRef } };
}

/** Simuliert eine frei zusammengestellte Komponentenauswahl. */
export function simulateConfig(v: Vehicle, cfg: Config): StageResult {
  const { ctx } = context(v);
  const e = evaluateConfig(v, ctx.model, cfg);
  const spread = ctx.model.confidence === "hoch" ? 0.04 : ctx.model.confidence === "mittel" ? 0.06 : 0.1;
  const range: [number, number] = [Math.max(v.power.ps, Math.round(e.ps * (1 - spread))), Math.round(e.ps * (1 + spread))];
  return build(ctx, "custom", cfg, "Meine Konfiguration", "Individuelle Komponentenauswahl, als Gesamtsystem bewertet.", range);
}

/** Fahrprofile einer Stufe: gleiche Spitzenleistung, andere Charakteristik. */
export function profileResults(v: Vehicle, stage: StageResult): Record<ProfileId, ProfileResult> {
  const { ctx } = context(v);
  const ch = chassisFor(ctx, stage.evaluation);
  const out = {} as Record<ProfileId, ProfileResult>;
  const isStock = stage.stage === "stock";
  for (const id of PROFILE_ORDER) {
    const p = PROFILES[id];
    const t = timesFor(ctx, ch, stage.spec, p);
    out[id] = {
      profile: id,
      acc0100: id === "performance" && isStock && v.performance.acc0100 != null ? v.performance.acc0100 : t.t100 == null ? null : r1(t.t100),
      acc80120: t.t80120 == null ? null : r1(t.t80120),
      acc100200: t.t100200 == null ? null : r1(t.t100200),
      consumption: stage.consumption?.value != null ? r1(stage.consumption.value * p.consumption) : null,
      thermal: Math.round(clamp(stage.evaluation.loads.thermal * p.thermal, 10, 100)),
    };
  }
  return out;
}
