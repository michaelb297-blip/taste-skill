/** Zentrale Domänentypen von Ultimate Performance Lab. */

export type Fuel = "petrol" | "diesel" | "electric" | "hydrogen";
export type Hybrid = "none" | "mhev" | "hev" | "phev";
export type Induction = "na" | "turbo" | "twin-turbo" | "supercharger" | "electric";
export type Drive = "FWD" | "RWD" | "AWD";
export type GearboxType = "manual" | "automatic" | "dct" | "cvt" | "single-speed";
export type Body = "coupe" | "sedan" | "hatch" | "wagon" | "suv" | "roadster" | "supercar" | "pickup";
export type Layout = "R" | "V" | "B" | "W";

/** Quellenbewertung A–F gemäß Pflichtenheft. */
export type SourceGrade = "A" | "B" | "C" | "D" | "E" | "F";

export const GRADE_LABEL: Record<SourceGrade, string> = {
  A: "Herstellerangabe",
  B: "Gemessener Prüfstandswert",
  C: "Dokumentierter Tunerwert",
  D: "Erfahrungsbericht",
  E: "Technische Schätzung",
  F: "Unbelegt",
};

/** Herkunft eines angezeigten Werts. */
export type Provenance = "gemessen" | "recherchiert" | "simuliert" | "katalog";

export interface SourceRef {
  title: string;
  url: string;
  grade: SourceGrade;
  /** ISO-Datum der Recherche */
  retrievedAt: string;
  note?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  generation: string;
  body: Body;
  yearFrom: number;
  /** null = wird noch gebaut */
  yearTo: number | null;
  variant: string;
  market?: string;
  engine: {
    code?: string;
    /** ID des Motorfamilien-Modells der Berechnungsengine */
    family?: string;
    name: string;
    displacementCc?: number;
    cylinders?: number;
    layout?: Layout;
    compression?: number;
    induction: Induction;
    turbos?: number;
    fuel: Fuel;
    hybrid: Hybrid;
    /** Serien-Ladedruck (Überdruck, bar) soweit bekannt */
    boostBar?: number;
    ecu?: string;
    cooling?: string;
    redline?: number;
    /** Front-, Mittel- oder Heckmotor (für Achslastverteilung) */
    position?: "front" | "mid" | "rear";
  };
  power: { ps: number; kw: number; rpmFrom?: number; rpmTo?: number };
  torque: { nm: number; rpmFrom?: number; rpmTo?: number };
  performance: {
    vmax?: number;
    vmaxLimited?: boolean;
    acc0100?: number;
    acc100200?: number;
  };
  gearbox: {
    type: GearboxType;
    gears: number;
    name?: string;
    ratios?: number[];
    finalDrive?: number;
    tcu?: string;
    /** dokumentierte bzw. angenommene Drehmomentgrenze des Seriengetriebes */
    torqueLimitNm?: number;
  };
  drive: Drive;
  weightKg: number;
  weightBasis?: "DIN" | "EU";
  aero?: { cd?: number; areaM2?: number };
  tyres?: { front: string; rear?: string };
  brakes?: string;
  tankL?: number;
  consumption?: { value: number; unit: "l/100km" | "kWh/100km" | "kg/100km"; cycle: "WLTP" | "NEFZ" | "EPA" };
  co2?: number;
  emission?: string;
  ev?: {
    batteryGrossKwh?: number;
    batteryNetKwh?: number;
    voltage?: number;
    motors?: { position: "front" | "rear"; kw?: number }[];
    rangeKm?: number;
    systemNote?: string;
  };
  notes?: string[];
  /** Belegte Quellen für diesen Datensatz (Live- oder Redaktionsrecherche) */
  sources?: SourceRef[];
  /** Abweichende Angaben aus unterschiedlichen Quellen */
  conflicts?: { field: string; values: { value: string; source: SourceRef }[] }[];
  /** true = vom Nutzer selbst eingegebenes Fahrzeug */
  custom?: boolean;
}

export type StageId = "stock" | "stage1" | "stage2" | "stage3s" | "stage3x";
export const STAGE_ORDER: StageId[] = ["stock", "stage1", "stage2", "stage3s", "stage3x"];
export const STAGE_LABEL: Record<StageId, string> = {
  stock: "Serie",
  stage1: "Stage 1",
  stage2: "Stage 2",
  stage3s: "Stage 3 Street",
  stage3x: "Stage 3 Extreme",
};
export const STAGE_COLOR: Record<StageId, string> = {
  stock: "#9aa4b2",
  stage1: "#2f8cff",
  stage2: "#35d0c0",
  stage3s: "#ffb020",
  stage3x: "#ff5a3c",
};

export type ProfileId = "eco" | "comfort" | "daily" | "sport" | "performance";
export const PROFILE_ORDER: ProfileId[] = ["eco", "comfort", "daily", "sport", "performance"];

export type Confidence = "hoch" | "mittel" | "niedrig";
/** Worauf ein Ergebnis beruht (Pflichtenheft Abschnitt 17). */
export type Basis = "messwerte" | "tunerwerte" | "berechnung" | "schaetzung";
export const BASIS_LABEL: Record<Basis, string> = {
  messwerte: "Echte Messwerte",
  tunerwerte: "Dokumentierte Tunerwerte",
  berechnung: "Technische Berechnung",
  schaetzung: "Schätzung",
};
