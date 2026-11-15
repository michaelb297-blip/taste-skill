import type { StageId, Vehicle } from "../types";
import { type EngineKind, type TuningModel } from "./families";

/**
 * Komponenten- und Systemmodell.
 *
 * Leistung entsteht nicht durch Addieren einzelner Teileversprechen. Jede
 * Baugruppe (Lader, Abgas, Ansaugung, Kraftstoff, Software) besitzt eine
 * Kapazität; die erreichbare Leistung ist das Minimum dieser Kapazitäten
 * (Engpassmodell). Das Drehmoment wird zusätzlich durch Rumpfmotor und
 * Getriebe begrenzt. Die Stage-Stufen sind lediglich Voreinstellungen
 * desselben Modells.
 */

export type Slot = "software" | "charger" | "intake" | "intercooler" | "exhaust" | "fuel" | "internals" | "drivetrain" | "cooling" | "chassis";

export const SLOT_LABEL: Record<Slot, string> = {
  software: "Software",
  charger: "Aufladung",
  intake: "Ansaugung",
  intercooler: "Ladeluftkühlung",
  exhaust: "Abgasanlage",
  fuel: "Kraftstoffsystem",
  internals: "Motorkomponenten",
  drivetrain: "Getriebe & Kupplung",
  cooling: "Kühlung",
  chassis: "Reifen & Gewicht",
};

export type Legal = "ok" | "eintragung" | "track";

export interface ComponentOption {
  id: string;
  slot: Slot;
  tier: number;
  name: string;
  description: string;
  /** Erwarteter Einfluss – qualitativ, weil er vom Gesamtsystem abhängt */
  effect: string;
  /** Materialkosten in Euro für einen Vierzylinder (Richtwert) */
  material: [number, number];
  laborH: number;
  /** Abstimmungskosten in Euro (Richtwert) */
  tuning?: [number, number];
  legal: Legal;
  legalNote?: string;
  effort: "kein" | "gering" | "mittel" | "hoch" | "sehr hoch";
}

export type Config = Partial<Record<Slot, string>>;

const o = (
  slot: Slot,
  id: string,
  tier: number,
  name: string,
  description: string,
  effect: string,
  material: [number, number],
  laborH: number,
  legal: Legal,
  effort: ComponentOption["effort"],
  extra: Partial<ComponentOption> = {},
): ComponentOption => ({ slot, id, tier, name, description, effect, material, laborH, legal, effort, ...extra });

const stock = (slot: Slot, name = "Serie"): ComponentOption => o(slot, "stock", 0, name, "Unveränderter Serienzustand.", "Keine Änderung.", [0, 0], 0, "ok", "kein");

const EINTRAGUNG = "Eintragungspflichtig: Teilegutachten/ABE und Abnahme nach § 19 StVZO (DE) bzw. Genehmigung nach § 33 KFG (AT).";
const EINZEL = "Nur mit Einzelabnahme (§ 21 StVZO in DE, Einzelgenehmigung in AT) inklusive Abgas- und Geräuschgutachten zulassungsfähig – in der Praxis oft nicht erreichbar.";

function softwareOptions(kind: EngineKind): ComponentOption[] {
  if (kind === "ev" || kind === "hev" || kind === "fcev")
    return [
      stock("software"),
      o("software", "tune", 1, "Kennlinien-Anpassung", "Angepasste Fahrpedal- und Rekuperationskennlinie, soweit das Fahrzeug dies zulässt.", "Ansprechverhalten; keine belegte Mehrleistung.", [300, 900], 0, "eintragung", "gering", { legalNote: "Eingriffe in die Antriebssteuerung können Garantie und Betriebserlaubnis berühren." }),
    ];
  return [
    stock("software"),
    o("software", "tune", 1, "Kennfeldoptimierung", kind === "turbo-diesel" ? "Angepasste Einspritzmenge, Ladedruck und Drehmomentbegrenzer bei aktiver Abgasnachbehandlung." : kind === "na-petrol" ? "Zündwinkel, Nockenwellenverstellung, Drosselklappenkennlinie und Drehzahlgrenze." : "Ladedruck, Zündwinkel, Einspritzung und Laststeuerung für die vorhandene Hardware.", "Hebt die Softwaregrenze bis zur Kapazität der vorhandenen Hardware (maximal Stage-2-Niveau).", [500, 1000], 0, "eintragung", "gering", { tuning: [150, 300], legalNote: EINTRAGUNG }),
    o("software", "dyno", 2, "Individualabstimmung auf dem Prüfstand", "Einzelabstimmung für geänderte Hardware mit Messläufen und Protokoll.", "Voraussetzung für größere Lader, geänderte Einspritzung oder Nockenwellen.", [0, 0], 0, "eintragung", "mittel", { tuning: [1400, 2600], legalNote: EINTRAGUNG }),
  ];
}

function chargerOptions(kind: EngineKind): ComponentOption[] {
  if (kind === "na-petrol")
    return [
      stock("charger", "Serien-Ventiltrieb"),
      o("charger", "cams", 1, "Schärfere Nockenwellen", "Nockenwellen mit mehr Hub und Steuerzeit, verstärkte Ventilfedern.", "Mehr Füllung im oberen Drehzahlbereich; Leerlauf und Teillast werden rauer.", [900, 2200], 10, "eintragung", "hoch", { legalNote: EINZEL }),
      o("charger", "head", 2, "Zylinderkopfbearbeitung mit Nockenwellen", "Bearbeitete Kanäle, größere Ventile, Nockenwellen, Ventilfedern.", "Maximale Füllung des Saugmotors; verlangt hochverdichtende Kolben für den vollen Effekt.", [3000, 6500], 24, "track", "sehr hoch", { legalNote: EINZEL }),
    ];
  if (kind === "sc-petrol")
    return [
      stock("charger", "Serienkompressor"),
      o("charger", "hybrid", 1, "Kleinere Riemenscheibe", "Höhere Kompressordrehzahl durch geänderte Übersetzung.", "Mehr Ladedruck; Ladelufttemperatur steigt deutlich.", [300, 900], 3, "eintragung", "mittel", { legalNote: EINTRAGUNG }),
      o("charger", "big", 2, "Größerer Kompressor", "Kompressor mit höherem Fördervolumen samt Ansaugbrücke.", "Deutlich höhere Luftmasse; erfordert Kraftstoff, Kühlung und verstärkten Rumpfmotor.", [5500, 9500], 12, "track", "sehr hoch", { legalNote: EINZEL }),
    ];
  return [
    stock("charger", "Serienlader"),
    o("charger", "hybrid", 1, "Hybrid-Turbolader", "Seriengehäuse mit größerem Verdichter- und Turbinenrad (Plug-and-play).", "Hebt die Luftmassengrenze über den Serienlader; spricht etwas später an.", [1800, 3200], 6, "eintragung", "hoch", { legalNote: EINZEL }),
    o("charger", "big", 2, "Großer Turbolader / Umbaukit", "Eigenständiger größerer Lader mit Krümmer, Ladeluft- und Ölführung.", "Maximale Luftmasse; verlangt Kraftstoffsystem, Kühlung und verstärkte Motorinnenteile.", [3800, 7000], 12, "track", "sehr hoch", { legalNote: EINZEL }),
  ];
}

function exhaustOptions(kind: EngineKind): ComponentOption[] {
  if (kind === "na-petrol")
    return [
      stock("exhaust", "Serienabgasanlage"),
      o("exhaust", "downpipe", 1, "Fächerkrümmer mit Sportkatalysator", "Strömungsgünstige Krümmer, Metallkatalysator mit Zulassung.", "Senkt den Gegendruck; beim Saugmotor wenige Prozent.", [1400, 3200], 6, "eintragung", "mittel", { legalNote: EINTRAGUNG }),
      o("exhaust", "full", 2, "Komplette Sportabgasanlage", "Krümmer, Sportkatalysatoren und Schalldämpfer ab Motor.", "Geringster Gegendruck; Geräuschgrenzwerte beachten.", [2800, 6000], 8, "eintragung", "mittel", { legalNote: EINTRAGUNG }),
    ];
  if (kind === "turbo-diesel")
    return [
      stock("exhaust", "Serienabgasanlage"),
      o("exhaust", "downpipe", 1, "Abgasanlage ab Partikelfilter", "Größerer Rohrquerschnitt hinter DPF und SCR – die Abgasreinigung bleibt vollständig erhalten.", "Etwas geringerer Gegendruck; kleiner Effekt.", [600, 1500], 2.5, "eintragung", "gering", { legalNote: EINTRAGUNG }),
      o("exhaust", "full", 2, "Downpipe mit Katalysator und Abgasanlage ab DPF", "Strömungsgünstigere Führung vor und hinter der serienmäßigen Abgasreinigung.", "Notwendig für größere Lader.", [1600, 3400], 5, "eintragung", "mittel", { legalNote: EINZEL }),
    ];
  return [
    stock("exhaust", "Serienabgasanlage"),
    o("exhaust", "downpipe", 1, "Downpipe mit Sportkatalysator", "Größerer Querschnitt mit 200- oder 300-Zellen-Metallkatalysator; Partikelfilter bleibt erhalten.", "Senkt den Abgasgegendruck hinter dem Lader – Voraussetzung für Stage 2.", [800, 1700], 2.5, "eintragung", "mittel", { legalNote: "Nur mit Katalysator und Gutachten zulässig. Varianten ohne Katalysator sind auf öffentlichen Straßen verboten und werden hier nicht angeboten." }),
    o("exhaust", "full", 2, "Downpipe mit Sportkatalysator und Sportabgasanlage", "Durchgehend größerer Querschnitt ab Lader mit Sportkatalysator.", "Geringster Gegendruck; nötig für größere Lader.", [2200, 4500], 4.5, "eintragung", "mittel", { legalNote: EINTRAGUNG }),
  ];
}

function fuelOptions(kind: EngineKind): ComponentOption[] {
  if (kind === "na-petrol")
    return [stock("fuel", "Serien-Kraftstoffsystem"), o("fuel", "full", 2, "Größere Einspritzdüsen und Pumpe", "Höherer Durchsatz für Hochdrehzahl-Umbauten.", "Sichert das Gemisch bei maximaler Füllung.", [800, 1800], 4, "eintragung", "mittel", { legalNote: EINZEL })];
  return [
    stock("fuel", "Serien-Kraftstoffsystem"),
    o("fuel", "hpfp", 1, kind === "turbo-diesel" ? "Hochdruckpumpe mit höherer Fördermenge" : "Hochdruckpumpe (HPFP) mit höherer Fördermenge", "Höherer Durchsatz der Hochdruckseite, optional stärkere Vorförderpumpe.", "Hebt die Kraftstoffgrenze auf Hybridlader-Niveau.", [700, 1600], 3, "eintragung", "mittel", { legalNote: EINZEL }),
    o("fuel", "full", 2, kind === "turbo-diesel" ? "Hochdruckpumpe und größere Injektoren" : "Hochdruckpumpe, Injektoren und zusätzliche Saugrohreinspritzung", "Vollständig überarbeitete Kraftstoffversorgung.", "Hebt die Kraftstoffgrenze für große Lader.", [2000, 4200], 7, "track", "hoch", { legalNote: EINZEL }),
  ];
}

function drivetrainOptions(v: Vehicle): ComponentOption[] {
  const auto = v.gearbox.type === "automatic" || v.gearbox.type === "dct";
  const opts = [stock("drivetrain", "Seriengetriebe")];
  if (auto)
    opts.push(o("drivetrain", "tcu", 1, "Getriebesoftware (TCU)", "Angepasste Kupplungsdrücke, Drehmomentgrenzen und Schaltzeiten.", "Hebt die übertragbare Drehmomentgrenze um rund 12 % und verkürzt Schaltzeiten.", [400, 800], 0, "eintragung", "gering", { legalNote: EINTRAGUNG }));
  opts.push(
    o("drivetrain", "clutch", 2, auto ? "Verstärkte Kupplungslamellen" : "Verstärkte Kupplung mit Schwungrad", "Reibbeläge und Anpressdruck für höheres Drehmoment.", "Hebt die übertragbare Drehmomentgrenze um rund 30 %.", [1300, 3000], 8, "ok", "hoch"),
    o("drivetrain", "built", 3, "Verstärktes Getriebe, Antriebswellen und Differenzial", "Verstärkte Zahnräder bzw. Kupplungspakete, Antriebswellen und Sperrdifferenzial.", "Hebt die übertragbare Drehmomentgrenze um rund 70 %.", [4500, 10000], 16, "ok", "sehr hoch"),
  );
  return opts;
}

/** Komponentenplätze und Optionen, die für dieses Fahrzeug technisch sinnvoll sind. */
export function slotsFor(v: Vehicle, model: TuningModel): { slot: Slot; label: string; options: ComponentOption[] }[] {
  const k = model.kind;
  const slot = (s: Slot, options: ComponentOption[], label = SLOT_LABEL[s]) => ({ slot: s, label, options });
  if (k === "ev" || k === "hev" || k === "fcev")
    return [
      slot("software", softwareOptions(k)),
      slot("cooling", [stock("cooling", "Serien-Thermomanagement"), o("cooling", "upgraded", 1, "Erweitertes Thermomanagement", "Zusätzliche Kühlleistung für Batterie, Leistungselektronik und Antrieb.", "Hält die Spitzenleistung länger; keine höhere Spitzenleistung.", [900, 2500], 6, "ok", "mittel")]),
      slot("chassis", [
        stock("chassis", "Serienbereifung"),
        o("chassis", "tyres", 1, "Semi-Slick-Bereifung", "Straßenzugelassene Sportreifen mit höherem Grip.", "Bessere Traktion beim Anfahren; höherer Verbrauch und Verschleiß.", [1200, 2400], 1, "ok", "gering"),
        o("chassis", "light", 2, "Semi-Slicks und Leichtbau", "Schmiederäder, leichtere Sitze und Bremsanlage (rund 60 kg weniger).", "Traktion plus geringere Masse.", [5000, 12000], 8, "eintragung", "hoch", { legalNote: EINTRAGUNG }),
      ]),
    ];
  const forced = k !== "na-petrol";
  const slots = [
    slot("software", softwareOptions(k)),
    slot("charger", chargerOptions(k), k === "na-petrol" ? "Zylinderkopf & Ventiltrieb" : k === "sc-petrol" ? "Kompressor" : "Turbolader"),
    slot("intake", [stock("intake", "Serienansaugung"), o("intake", "sport", 1, "Sportluftfilter / optimierte Ansaugung", "Größerer Filterquerschnitt und strömungsgünstigere Ansaugwege.", "Beseitigt den Ansaug-Engpass oberhalb von Stage 1; allein kaum messbar.", [250, 800], 1, "eintragung", "gering", { legalNote: EINTRAGUNG })]),
  ];
  if (forced)
    slots.push(slot("intercooler", [stock("intercooler", "Serien-Ladeluftkühler"), o("intercooler", "upgraded", 1, "Größerer Ladeluftkühler", "Mehr Kühlfläche bzw. zusätzlicher Wasserkreislauf.", "Niedrigere Ansauglufttemperatur: stabile Leistung bei Dauerlast.", [500, 1300], 2.5, "ok", "mittel")]));
  slots.push(
    slot("exhaust", exhaustOptions(k)),
    slot("fuel", fuelOptions(k)),
    slot("internals", [
      stock("internals", "Serien-Rumpfmotor"),
      o("internals", "forged", 1, k === "na-petrol" ? "Hochverdichtende Schmiedekolben, Pleuel, Lager" : "Schmiedekolben, verstärkte Pleuel und Lager", "Überarbeiteter Rumpfmotor mit verstärkten Innenteilen, ARP-Verschraubung, optimierter Kurbelwelle.", k === "na-petrol" ? "Höhere Verdichtung und Drehzahlfestigkeit." : "Hebt die Drehmomentgrenze des Rumpfmotors deutlich.", [4000, 8000], 35, "ok", "sehr hoch"),
    ]),
    slot("drivetrain", drivetrainOptions(v)),
    slot("cooling", [stock("cooling", "Serienkühlung"), o("cooling", "upgraded", 1, "Zusätzlicher Ölkühler und größerer Wasserkühler", "Mehr Kühlleistung für Öl und Kühlmittel.", "Senkt die thermische Belastung bei Dauerlast.", [700, 1700], 4, "ok", "mittel")]),
  );
  return slots;
}

export function optionOf(v: Vehicle, model: TuningModel, slot: Slot, id: string | undefined): ComponentOption | undefined {
  const s = slotsFor(v, model).find((x) => x.slot === slot);
  return s?.options.find((x) => x.id === (id ?? "stock"));
}

const tierOf = (v: Vehicle, model: TuningModel, cfg: Config, slot: Slot) => optionOf(v, model, slot, cfg[slot])?.tier ?? 0;

const DRIVETRAIN_FACTOR = [1, 1.12, 1.3, 1.7];

export interface Issue {
  level: "error" | "warn" | "info";
  text: string;
}

export interface Costs {
  material: [number, number];
  labor: [number, number];
  tuning: [number, number];
  total: [number, number];
  items: { name: string; slot: Slot; material: [number, number]; laborH: number; tuning: [number, number] }[];
  extras: string[];
}

export interface Evaluation {
  ps: number;
  nm: number;
  /** Drehmoment, das die Luftmasse hergäbe, bevor Motor/Getriebe begrenzen */
  potentialNm: number;
  /** Namen der begrenzenden Baugruppen */
  limitedBy: string[];
  issues: Issue[];
  loads: { engine: number; gearbox: number; thermal: number };
  reliability: { score: number; label: string };
  flags: { trackOnly: boolean; notRoadLegal: boolean; needsApproval: boolean; highMaintenance: boolean; highRisk: boolean };
  chargerTier: number;
  /** Fahrphysik-Einflüsse (Elektro/Leichtbau) */
  muFactor: number;
  massDeltaKg: number;
  costs: Costs;
  hardware: ComponentOption[];
}

export const LABOR_RATE: [number, number] = [110, 160];

export function costScale(v: Vehicle): number {
  const cyl = v.engine.cylinders ?? 4;
  const byCyl = cyl <= 3 ? 0.9 : cyl === 4 ? 1 : cyl === 5 ? 1.25 : cyl === 6 ? 1.4 : cyl === 8 ? 1.9 : 2.6;
  const tier = v.body === "supercar" ? 1.7 : v.power.ps >= 500 ? 1.3 : 1;
  return byCyl * tier;
}

function interp(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

/** Bewertet eine Komponentenauswahl als Gesamtsystem. */
export function evaluateConfig(v: Vehicle, model: TuningModel, cfg: Config): Evaluation {
  const T = model.targets;
  const k = model.kind;
  const issues: Issue[] = [];
  const limitedBy: string[] = [];
  const tier = (s: Slot) => tierOf(v, model, cfg, s);
  const sw = tier("software");
  const ch = tier("charger");
  const ex = tier("exhaust");
  const inT = tier("intake");
  const ic = tier("intercooler");
  const fu = tier("fuel");
  const int = tier("internals");
  const dt = tier("drivetrain");
  const co = tier("cooling");
  const chs = tier("chassis");
  const stockPs = v.power.ps;
  const stockNm = v.torque.nm;
  const electricLike = k === "ev" || k === "hev" || k === "fcev";
  const INF = Number.POSITIVE_INFINITY;

  let ps = stockPs;
  if (!electricLike && sw > 0) {
    const caps: [string, number][] = [];
    if (k === "na-petrol") {
      caps.push(["Zylinderkopf & Ventiltrieb", [T.stage2.ps, T.stage3s.ps, T.stage3x.ps][ch]]);
      caps.push(["Abgasanlage", [T.stage1.ps, T.stage3s.ps, INF][ex]]);
      caps.push(["Ansaugung", inT ? INF : T.stage1.ps * 1.01]);
      caps.push(["Kraftstoffsystem", fu ? INF : T.stage3s.ps * 1.02]);
      caps.push(["Verdichtung / Rumpfmotor", int ? INF : T.stage3s.ps * 1.02]);
    } else {
      caps.push([k === "sc-petrol" ? "Kompressor" : "Turbolader", [T.stage2.ps, T.stage3s.ps, T.stage3x.ps][ch]]);
      caps.push(["Abgasanlage", [T.stage1.ps, T.stage3s.ps, INF][ex]]);
      caps.push(["Ansaugung", inT ? INF : T.stage1.ps * 1.04]);
      caps.push(["Kraftstoffsystem", [T.stage2.ps * 1.03, T.stage3s.ps * 1.02, INF][fu]]);
    }
    caps.push(["Software", sw === 1 ? T.stage2.ps : INF]);
    const min = Math.min(...caps.map((c) => c[1]));
    ps = Math.max(stockPs, min);
    for (const [name, cap] of caps) if (cap <= min * 1.005 && cap < T.stage3x.ps) limitedBy.push(name);
    // Ladeluftkühlung: oberhalb von Stage 1 kostet der Serienkühler Leistung
    if (k !== "na-petrol" && ic === 0 && ps > T.stage1.ps * 1.06) {
      ps *= 0.965;
      issues.push({ level: "warn", text: "Der Serien-Ladeluftkühler ist oberhalb von Stage 1 thermisch überfordert: Ansauglufttemperatur steigt, die Motorsteuerung nimmt Zündwinkel zurück (rund 3–4 % weniger Leistung, stärker bei Dauerlast)." });
    }
  }
  ps = Math.round(ps);

  // Abhängigkeiten zwischen Komponenten
  if (!electricLike) {
    if (sw === 0 && (ch > 0 || ex > 0 || inT > 0 || fu > 0 || ic > 0))
      issues.push({ level: ch > 0 ? "error" : "warn", text: ch > 0 ? "Ein geänderter Lader bzw. Ventiltrieb läuft ohne angepasste Software nicht betriebssicher – Software ergänzen." : "Ohne Softwareanpassung bleibt die Hardware wirkungslos: Die Motorsteuerung regelt auf Serienwerte." });
    if (ch > 0 && sw === 1)
      issues.push({ level: "error", text: "Geänderte Lader- bzw. Ventiltrieb-Hardware verlangt eine Individualabstimmung auf dem Prüfstand; ein Standard-Kennfeld deckt sie nicht ab." });
    if (k !== "na-petrol" && ch === 1 && fu === 0)
      issues.push({ level: "warn", text: `Das Serien-Kraftstoffsystem begrenzt auf rund ${Math.round(T.stage2.ps * 1.03)} PS – der größere Lader bleibt ohne stärkere Hochdruckpumpe weitgehend ungenutzt.` });
    if (k !== "na-petrol" && ch === 2 && fu < 2)
      issues.push({ level: "warn", text: "Der große Lader fördert mehr Luft, als das Kraftstoffsystem abdecken kann. Ohne vollständige Kraftstoff-Aufrüstung droht Abmagern unter Last; die Leistung wird begrenzt." });
    if (ch === 2 && int === 0)
      issues.push({ level: "warn", text: "Großer Lader bzw. bearbeiteter Kopf auf Serien-Rumpfmotor: Das Drehmoment wird auf die Grenze der Serien-Innenteile begrenzt – ohne verstärkte Kolben und Pleuel bleibt der Umbau weit unter seinem Potenzial." });
    if (ch > 0 && ex < 2 && k !== "na-petrol")
      issues.push({ level: "info", text: "Für geänderte Lader wird eine durchgehend größere Abgasanlage empfohlen; die Seriendimension erhöht den Gegendruck." });
    if (ch > 0 && co === 0)
      issues.push({ level: "warn", text: "Ohne zusätzliche Öl- und Wasserkühlung steigt die thermische Belastung bei dieser Leistung deutlich." });
    if (k === "na-petrol" && ch === 2 && int === 0)
      issues.push({ level: "warn", text: "Die Kopfbearbeitung entfaltet ihr Potenzial erst mit hochverdichtenden Kolben." });
  }

  // Drehmoment: Potenzial aus der Luftmasse, begrenzt durch Rumpfmotor und Getriebe
  const curve: [number, number][] = [
    [stockPs, stockNm],
    [T.stage1.ps, T.stage1.nm],
    [T.stage2.ps, T.stage2.nm],
    [T.stage3s.ps, T.stage3s.nm],
    [T.stage3x.ps, T.stage3x.nm],
  ];
  const sorted = curve.filter((p, i) => i === 0 || p[0] > curve[i - 1][0]);
  const potentialNm = Math.round(ps <= stockPs ? stockNm : interp(sorted, ps));
  const engineLimit = int ? model.internalsBuiltNm : model.internalsNm;
  const gearboxLimit = Math.round(model.gearboxNm * DRIVETRAIN_FACTOR[dt]);
  let nm = potentialNm;
  if (!electricLike && ps > stockPs) {
    if (nm > engineLimit) {
      nm = engineLimit;
      limitedBy.push("Rumpfmotor (Drehmoment)");
      issues.push({ level: "warn", text: `Das Drehmoment wird auf ${engineLimit} Nm begrenzt, um ${int ? "den verstärkten" : "den Serien-"}Rumpfmotor zu schützen (Potenzial der Luftmasse: ${potentialNm} Nm).` });
    }
    if (nm > gearboxLimit) {
      nm = gearboxLimit;
      limitedBy.push("Getriebe (Drehmoment)");
      issues.push({ level: "warn", text: `Das Getriebe überträgt in dieser Ausbaustufe rund ${gearboxLimit} Nm${model.gearboxAssumed ? " (Annahme)" : ""}. Das Drehmoment wird darauf begrenzt – ${dt < 3 ? "eine stärkere Getriebe-/Kupplungsstufe hebt die Grenze" : "die höchste Ausbaustufe ist bereits gewählt"}.` });
    }
    nm = Math.max(nm, stockNm);
  }

  // Belastungskennzahlen (0–100 %, über 100 % = außerhalb der Auslegung)
  const gain = ps / stockPs - 1;
  const engineLoad = Math.round((nm / engineLimit) * 100);
  const gearboxLoad = Math.round((nm / gearboxLimit) * 100);
  let thermal = 38 + gain * 85;
  if (ic) thermal -= gain * 14;
  if (co) thermal -= gain * 16 + 3;
  if (ch === 2) thermal += 6;
  if (electricLike) thermal = co ? 30 : 38;
  thermal = Math.round(Math.max(20, Math.min(100, thermal)));

  let score = 96;
  score -= Math.max(0, engineLoad - 70) * 0.5;
  score -= Math.max(0, gearboxLoad - 75) * 0.4;
  score -= Math.max(0, thermal - 45) * 0.45;
  score -= ch * 6 + (int ? 4 : 0);
  score -= issues.filter((i) => i.level === "error").length * 25 + issues.filter((i) => i.level === "warn").length * 3;
  score = Math.round(Math.max(5, Math.min(98, score)));
  const label = score >= 85 ? "hoch" : score >= 70 ? "gut" : score >= 55 ? "eingeschränkt" : score >= 35 ? "kritisch" : "sehr kritisch";

  const hardware: ComponentOption[] = [];
  for (const s of slotsFor(v, model)) {
    const opt = s.options.find((x) => x.id === (cfg[s.slot] ?? "stock"));
    if (opt && opt.id !== "stock") hardware.push(opt);
  }

  const trackOnly = hardware.some((h) => h.legal === "track");
  const needsApproval = hardware.some((h) => h.legal !== "ok");
  if (trackOnly)
    issues.push({ level: "warn", text: "Diese Konfiguration ist in Deutschland und Österreich praktisch nicht zulassungsfähig (Abgas- und Geräuschverhalten). Sie ist ausschließlich für abgesperrte Strecken gedacht." });

  return {
    ps,
    nm: Math.round(nm),
    potentialNm,
    limitedBy: [...new Set(limitedBy)],
    issues,
    loads: { engine: engineLoad, gearbox: gearboxLoad, thermal },
    reliability: { score, label },
    flags: { trackOnly, notRoadLegal: trackOnly, needsApproval, highMaintenance: ch === 2 || int > 0, highRisk: score < 55 },
    chargerTier: ch,
    muFactor: chs >= 1 ? 1.07 : 1,
    massDeltaKg: chs >= 2 ? -60 : 0,
    costs: computeCosts(v, hardware, ch, k),
    hardware,
  };
}

function computeCosts(v: Vehicle, hardware: ComponentOption[], chargerTier: number, kind: EngineKind): Costs {
  const scale = costScale(v);
  const softScale = Math.min(scale, 1.8);
  const rnd = (x: number) => Math.round(x / 10) * 10;
  const items = hardware.map((h) => {
    const sc = h.slot === "software" ? softScale : h.slot === "chassis" ? 1 : scale;
    return {
      name: h.name,
      slot: h.slot,
      material: [rnd(h.material[0] * sc), rnd(h.material[1] * sc)] as [number, number],
      laborH: Math.round(h.laborH * (h.slot === "software" ? 1 : Math.sqrt(scale)) * 10) / 10,
      tuning: [rnd((h.tuning?.[0] ?? 0) * softScale), rnd((h.tuning?.[1] ?? 0) * softScale)] as [number, number],
    };
  });
  const sum = (f: (i: (typeof items)[number]) => number) => items.reduce((a, i) => a + f(i), 0);
  const material: [number, number] = [sum((i) => i.material[0]), sum((i) => i.material[1])];
  const hours = sum((i) => i.laborH);
  const labor: [number, number] = [rnd(hours * LABOR_RATE[0]), rnd(hours * LABOR_RATE[1])];
  const tuning: [number, number] = [sum((i) => i.tuning[0]), sum((i) => i.tuning[1])];
  const extras: string[] = [];
  if (hardware.length) extras.push("Eintragung/Abnahme (TÜV, DEKRA bzw. Landesprüfstelle): je nach Umfang ca. 100–1.500 €");
  if (chargerTier >= 1) extras.push("Leistungsfähigere Bremsanlage und Reifen mit passendem Geschwindigkeitsindex");
  if (chargerTier >= 2) extras.push("Fahrwerk, Sperrdifferenzial, Motorlager; verkürzte Wartungsintervalle (Öl, Zündkerzen)");
  if (kind === "turbo-petrol" && chargerTier >= 1) extras.push("Zündkerzen mit niedrigerem Wärmewert, ggf. stärkere Zündspulen");
  return { material, labor, tuning, total: [material[0] + labor[0] + tuning[0], material[1] + labor[1] + tuning[1]], items, extras };
}

/** Voreinstellung einer Stage – wählt nur Komponenten, die das Fahrzeug tatsächlich braucht. */
export function stageConfig(v: Vehicle, model: TuningModel, stage: StageId): Config {
  if (stage === "stock") return {};
  const k = model.kind;
  const slots = slotsFor(v, model);
  const has = (s: Slot, id: string) => slots.find((x) => x.slot === s)?.options.some((op) => op.id === id) ?? false;
  let cfg: Config;
  if (k === "ev" || k === "hev" || k === "fcev") {
    cfg = stage === "stage1" ? { software: "tune" } : stage === "stage2" ? { software: "tune", chassis: "tyres" } : stage === "stage3s" ? { software: "tune", chassis: "tyres", cooling: "upgraded" } : { software: "tune", chassis: "light", cooling: "upgraded" };
    return cfg;
  }
  if (k === "na-petrol") {
    cfg =
      stage === "stage1"
        ? { software: "tune" }
        : stage === "stage2"
          ? { software: "tune", intake: "sport", exhaust: "downpipe" }
          : stage === "stage3s"
            ? { software: "dyno", charger: "cams", intake: "sport", exhaust: "full", cooling: "upgraded" }
            : { software: "dyno", charger: "head", intake: "sport", exhaust: "full", fuel: "full", internals: "forged", cooling: "upgraded" };
  } else {
    cfg =
      stage === "stage1"
        ? { software: "tune" }
        : stage === "stage2"
          ? { software: "tune", intake: "sport", intercooler: "upgraded", exhaust: "downpipe" }
          : stage === "stage3s"
            ? { software: "dyno", charger: "hybrid", intake: "sport", intercooler: "upgraded", exhaust: "full", fuel: "hpfp", cooling: "upgraded" }
            : { software: "dyno", charger: "big", intake: "sport", intercooler: "upgraded", exhaust: "full", fuel: "full", internals: "forged", cooling: "upgraded" };
  }
  // Getriebe/Kupplung nur so weit aufrüsten, wie das Drehmoment es verlangt
  const maxTier = stage === "stage1" ? 1 : stage === "stage3x" ? 3 : 2;
  const ladder = ["stock", "tcu", "clutch", "built"];
  const need = Math.min(evaluateConfig(v, model, cfg).potentialNm, stage === "stage3x" ? model.internalsBuiltNm : model.internalsNm);
  let pick = "stock";
  for (let t = 0; t <= maxTier; t++) {
    if (!has("drivetrain", ladder[t])) continue;
    pick = ladder[t];
    if (model.gearboxNm * DRIVETRAIN_FACTOR[t] >= need) break;
  }
  if (stage === "stage3x") pick = "built";
  if (pick !== "stock") cfg.drivetrain = pick;
  return cfg;
}

export const STAGE_DESCRIPTION: Record<EngineKind, Record<Exclude<StageId, "stock">, string>> = (() => {
  const turbo = {
    stage1: "Softwareoptimierung des Serienmotors: Ladedruck, Zündwinkel, Einspritzung und Laststeuerung – ohne Hardwareumbau.",
    stage2: "Serienlader mit entdrosselter Peripherie: Ansaugung, größerer Ladeluftkühler, Downpipe mit Sportkatalysator und angepasste Software.",
    stage3s: "Hybrid-Lader auf Serien-Rumpfmotor mit stärkerer Kraftstoffversorgung und Kühlung. Drehmoment bleibt innerhalb der Grenzen von Motor und Getriebe.",
    stage3x: "Maximales Potenzial des Motorkonzepts: großer Lader, verstärkter Rumpfmotor, vollständiges Kraftstoffsystem, verstärkter Antriebsstrang.",
  };
  return {
    "turbo-petrol": turbo,
    phev: { ...turbo, stage1: "Softwareoptimierung des Verbrenners; E-Maschine und Hochvoltsystem bleiben unverändert." },
    "turbo-diesel": {
      stage1: "Softwareoptimierung: Einspritzmenge, Ladedruck und Drehmomentbegrenzer – Abgasnachbehandlung bleibt vollständig aktiv.",
      stage2: "Größerer Ladeluftkühler, Ansaugung und Abgasanlage hinter dem Partikelfilter mit angepasster Software.",
      stage3s: "Hybrid-Lader, stärkere Hochdruckpumpe und Kühlung auf Serien-Rumpfmotor.",
      stage3x: "Großer Lader, größere Injektoren, verstärkter Rumpfmotor und Antriebsstrang.",
    },
    "na-petrol": {
      stage1: "Softwareoptimierung des Saugmotors: Zündwinkel, Nockenwellenverstellung, Drosselklappenkennlinie. Der Zugewinn ist konstruktionsbedingt klein.",
      stage2: "Ansaugung und Fächerkrümmer mit Sportkatalysator samt angepasster Software.",
      stage3s: "Schärfere Nockenwellen, komplette Abgasanlage und Individualabstimmung.",
      stage3x: "Zylinderkopfbearbeitung, hochverdichtende Schmiedekolben, Einspritzung – das Saugmotor-Konzept bleibt erhalten.",
    },
    "sc-petrol": {
      stage1: "Softwareoptimierung des Kompressormotors ohne Hardwareumbau.",
      stage2: "Ansaugung, Ladeluftkühlung und Abgasanlage mit Sportkatalysator samt angepasster Software.",
      stage3s: "Kleinere Riemenscheibe für mehr Ladedruck, stärkere Kraftstoffversorgung und Kühlung.",
      stage3x: "Größerer Kompressor, verstärkter Rumpfmotor, vollständiges Kraftstoffsystem, verstärkter Antriebsstrang.",
    },
    ev: {
      stage1: "Softwareseitige Kennlinien-Anpassung. Eine Leistungsfreigabe ist für dieses Fahrzeug nicht belegt – die Spitzenleistung bleibt unverändert.",
      stage2: "Zusätzlich Semi-Slick-Bereifung für mehr Traktion beim Anfahren.",
      stage3s: "Zusätzlich erweitertes Thermomanagement: Die Spitzenleistung steht länger zur Verfügung.",
      stage3x: "Zusätzlich Leichtbau (rund 60 kg). Keine Eingriffe in Hochvoltsystem oder Motoren.",
    },
    hev: {
      stage1: "Kennlinien-Anpassung ohne Mehrleistung.",
      stage2: "Zusätzlich Sportbereifung.",
      stage3s: "Zusätzlich erweitertes Thermomanagement.",
      stage3x: "Zusätzlich Leichtbau (rund 60 kg).",
    },
    fcev: {
      stage1: "Kennlinien-Anpassung ohne Mehrleistung.",
      stage2: "Zusätzlich Sportbereifung.",
      stage3s: "Zusätzlich erweitertes Thermomanagement.",
      stage3x: "Zusätzlich Leichtbau (rund 60 kg).",
    },
  };
})();

export const LEGAL_NOTES: string[] = [
  "Ultimate Performance Lab ist ein Simulations- und Informationswerkzeug. Es programmiert keine Steuergeräte und greift in kein Fahrzeug ein.",
  "Deutschland: Leistungssteigerungen und geänderte Bauteile müssen nach § 19 StVZO abgenommen und eingetragen werden; ohne Eintragung erlischt die Betriebserlaubnis.",
  "Österreich: Änderungen sind nach § 33 KFG dem Landeshauptmann anzuzeigen und genehmigen zu lassen (Typisierung).",
  "Abgas- und Geräuschgrenzwerte der Typgenehmigung gelten weiter. Katalysatoren, Partikelfilter, AGR und SCR dürfen nicht entfernt oder deaktiviert werden.",
  "Die Versicherung ist über jede Leistungsänderung zu informieren; andernfalls drohen Regress und Verlust des Versicherungsschutzes.",
  "Herstellergarantie und Sachmängelhaftung können für betroffene Bauteile entfallen.",
  "Mehr Leistung verlangt passende Bremsen, Reifen und Fahrwerk. Sicherheitssysteme (ABS, ESP, Airbags) bleiben unangetastet.",
];
