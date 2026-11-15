import type { SourceGrade, Vehicle } from "../types";

export type FindingKind = "spezifikation" | "tuning" | "pruefstand" | "erfahrung" | "sonstiges";

export interface ExtractedValue {
  kind: "leistung" | "radleistung" | "drehmoment" | "beschleunigung";
  value: number;
  unit: string;
  /** Textstelle, aus der der Wert stammt */
  context: string;
}

export interface Finding {
  id: string;
  provider: string;
  title: string;
  url: string;
  snippet: string;
  grade: SourceGrade;
  gradeReason: string;
  kind: FindingKind;
  /** ISO-Zeitpunkt der Recherche */
  retrievedAt: string;
  /** Leistung am Motor oder an den Rädern gemessen/angegeben */
  measuredAt: "motor" | "rad" | "unbekannt";
  values: ExtractedValue[];
  /** true = redaktionell geprüft und im Projekt hinterlegt */
  curated?: boolean;
}

export interface ProviderStatus {
  id: string;
  label: string;
  type: "lokal" | "frei" | "api";
  configured: boolean;
  ok: boolean;
  count: number;
  message: string;
  envVar?: string;
}

export interface ResearchQuery {
  vehicle: Vehicle;
  queries: string[];
}

/**
 * Datenquellen-Abstraktion: Jede Suchmaschine, API oder Datenbank
 * implementiert dieses Interface und wird in `providers/index.ts` registriert.
 */
export interface ResearchProvider {
  id: string;
  label: string;
  type: ProviderStatus["type"];
  envVar?: string;
  isConfigured(): boolean;
  search(q: ResearchQuery, signal: AbortSignal): Promise<Finding[]>;
}

export interface ResearchReport {
  vehicleId: string;
  generatedAt: string;
  /** true = mindestens eine Live-Quelle hat geantwortet */
  live: boolean;
  fromCache: boolean;
  providers: ProviderStatus[];
  findings: Finding[];
  notice: string;
}

export interface VehicleImage {
  view: "aussen" | "front" | "heck" | "innenraum" | "motorraum";
  title: string;
  thumbUrl: string;
  pageUrl: string;
  author: string;
  license: string;
  licenseUrl?: string;
}

export interface ImageReport {
  vehicleId: string;
  live: boolean;
  fromCache: boolean;
  images: VehicleImage[];
  notice: string;
}
