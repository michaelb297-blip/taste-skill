import type { ProfileId } from "../types";

/**
 * Fahrprofile verändern die CHARAKTERISTIK, nicht die Spitzenleistung:
 * Gasannahme, Schaltstrategie, Anfahrverhalten, Verbrauch und Belastung.
 */
export interface Profile {
  id: ProfileId;
  name: string;
  goal: string;
  /** Zeitkonstante des Drehmomentaufbaus nach Anfahren/Schalten (s) */
  torqueTau: number;
  /** Faktor auf die Schaltzeit */
  shiftTimeMul: number;
  /** Anteil der optimalen Schaltdrehzahl, der bei Volllast ausgedreht wird */
  shiftFrac: number;
  /** Faktor auf die Anfahrdrehzahl */
  launchMul: number;
  /** Verbrauch relativ zum Profil Daily bei gleicher Fahrweise */
  consumption: number;
  /** Thermische Belastung relativ zu Daily */
  thermal: number;
  /** Skalen 1–5 für die Anzeige */
  response: number;
  comfort: number;
  noise: number;
  traits: string[];
}

export const PROFILES: Record<ProfileId, Profile> = {
  eco: {
    id: "eco", name: "Eco", goal: "Möglichst geringer Verbrauch und geringe Belastung",
    torqueTau: 0.55, shiftTimeMul: 1.5, shiftFrac: 0.88, launchMul: 0.7, consumption: 0.92, thermal: 0.85, response: 1, comfort: 4, noise: 1,
    traits: ["Sanfte Gasannahme, früh hochschalten", "Optimierte Teillast und Segelphasen", "Volle Leistung erst bei Kickdown"],
  },
  comfort: {
    id: "comfort", name: "Comfort", goal: "Sanfte Leistungsentfaltung und komfortable Schaltvorgänge",
    torqueTau: 0.4, shiftTimeMul: 1.3, shiftFrac: 0.93, launchMul: 0.8, consumption: 0.97, thermal: 0.92, response: 2, comfort: 5, noise: 1,
    traits: ["Weicher Drehmomentaufbau", "Komfortable, überschneidende Schaltvorgänge", "Niedrige Geräuschentwicklung"],
  },
  daily: {
    id: "daily", name: "Daily", goal: "Alltagstauglich, ausgewogen, zuverlässig",
    torqueTau: 0.25, shiftTimeMul: 1.1, shiftFrac: 0.97, launchMul: 0.9, consumption: 1.0, thermal: 1.0, response: 3, comfort: 4, noise: 2,
    traits: ["Gutes Ansprechverhalten", "Ausgewogene Drehmomentabgabe", "Vertretbarer Verbrauch"],
  },
  sport: {
    id: "sport", name: "Sport", goal: "Direkte Gasannahme und schnelle Schaltvorgänge",
    torqueTau: 0.12, shiftTimeMul: 0.9, shiftFrac: 1.0, launchMul: 1.0, consumption: 1.07, thermal: 1.08, response: 4, comfort: 3, noise: 4,
    traits: ["Direkte Gasannahme", "Gänge werden ausgedreht", "Schnellere Schaltvorgänge"],
  },
  performance: {
    id: "performance", name: "Performance", goal: "Maximale abrufbare Leistung innerhalb der gewählten Stage",
    torqueTau: 0.05, shiftTimeMul: 0.75, shiftFrac: 1.0, launchMul: 1.0, consumption: 1.14, thermal: 1.16, response: 5, comfort: 2, noise: 5,
    traits: ["Sofortiger Drehmomentaufbau", "Kürzeste Schaltzeiten, Launch-Strategie", "Höchste thermische Belastung"],
  },
};
