import type { SourceGrade } from "../types";
import type { ExtractedValue, Finding, FindingKind } from "./types";

const MANUFACTURER = /(press\.bmwgroup|bmw\.(de|at|com)|mercedes-benz\.|media\.mercedes|audi-mediacenter|audi\.(de|at|com)|volkswagen-newsroom|volkswagen\.|newsroom\.porsche|porsche\.com|toyota\.|honda\.|ford\.|hyundai\.|kia\.|tesla\.com|media\.stellantis|renault\.|ferrari\.com|lamborghini\.com|mclaren\.com|nissan|mazda\.|subaru\.|skoda|seat\.|cupraofficial|volvocars|polestar\.com|byd\.com|nio\.com|xpeng\.com)/i;
const DATABASE = /(adac\.de|auto-data\.net|automobile-catalog|ultimatespecs|autoevolution|encycarpedia|kba\.de|zeperfs|fastestlaps|cars-data)/i;
const FORUM = /(forum|bimmerpost|spoolstreet|reddit\.com|motor-talk|golfmk|audizine|rennlist|mbworld|vwvortex|civicx|ft86club|nasioc|e90post|1addicts|community)/i;
const TUNER = /(tuning|chiptuning|remap|racechip|abt-sportsline|mtm-online|manhart|hgp|dte-systems|bootmod3|mhd|apr\.com|unitronic|revo|wetterauer|speed-buster|mcchip|file-service|turnermotorsport|ecutek|cobb|litchfield|hennessey|brabus|renntech|eventuri|puretur|performance)/i;
const DYNO = /(prüfstand|pruefstand|leistungsmessung|dyno|dynojet|maha|mustang dyno|whp|wtq|gemessen|measured|rollenprüfstand)/i;

export function classify(url: string, text: string): { grade: SourceGrade; reason: string; kind: FindingKind } {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* ungültige URL: bleibt unbelegt */
  }
  const t = text.toLowerCase();
  const tuningTopic = /(stage ?[123]|chiptuning|remap|leistungssteigerung|tune)/i.test(t);
  if (MANUFACTURER.test(host) && !TUNER.test(host)) return { grade: "A", reason: "Domain eines Herstellers bzw. Hersteller-Pressedienstes", kind: "spezifikation" };
  if (DATABASE.test(host)) return { grade: "A", reason: "Technische Fahrzeugdatenbank mit Herstellerangaben", kind: "spezifikation" };
  if (FORUM.test(host)) return DYNO.test(t)
    ? { grade: "D", reason: "Erfahrungsbericht mit Hinweis auf eine Prüfstandsmessung – Messprotokoll nicht geprüft", kind: "pruefstand" }
    : { grade: "D", reason: "Community- bzw. Forenbeitrag", kind: "erfahrung" };
  if (TUNER.test(host)) return { grade: "C", reason: "Angabe eines Tuners oder Teileanbieters (Werbeaussage möglich)", kind: "tuning" };
  if (DYNO.test(t) && tuningTopic) return { grade: "D", reason: "Text nennt eine Prüfstandsmessung; Herkunft und Messbedingungen sind nicht belegt", kind: "pruefstand" };
  if (/wikipedia\.org/.test(host)) return { grade: "F", reason: "Sekundärquelle; Einzelnachweise nicht geprüft", kind: "spezifikation" };
  return { grade: "F", reason: "Quelle nicht einzuordnen bzw. Angabe nicht ausreichend belegt", kind: tuningTopic ? "tuning" : "sonstiges" };
}

/** Zieht Leistungs- und Drehmomentwerte aus einem Textausschnitt – ohne sie zu bewerten. */
export function extractValues(text: string): ExtractedValue[] {
  const out: ExtractedValue[] = [];
  const ctx = (i: number, len: number) => text.slice(Math.max(0, i - 40), i + len + 40).replace(/\s+/g, " ").trim();
  const push = (kind: ExtractedValue["kind"], value: number, unit: string, m: RegExpExecArray) => {
    if (!out.some((o) => o.kind === kind && o.value === value && o.unit === unit)) out.push({ kind, value, unit, context: ctx(m.index, m[0].length) });
  };
  let m: RegExpExecArray | null;
  const wheel = /(\d{2,4})\s?(whp|wps|rad-?ps)\b/gi;
  while ((m = wheel.exec(text))) push("radleistung", Number(m[1]), m[2].toLowerCase(), m);
  const power = /(\d{2,4})\s?(ps|hp|bhp|cv|kw)\b/gi;
  while ((m = power.exec(text))) {
    const v = Number(m[1]);
    if (v >= 40 && v <= 2500) push("leistung", v, m[2].toLowerCase() === "kw" ? "kW" : m[2].toUpperCase() === "PS" ? "PS" : m[2].toLowerCase(), m);
  }
  const torque = /(\d{2,4})\s?(nm|lb-?ft|ft-?lb)\b/gi;
  while ((m = torque.exec(text))) {
    const v = Number(m[1]);
    if (v >= 60 && v <= 3000) push("drehmoment", v, m[2].toLowerCase() === "nm" ? "Nm" : "lb-ft", m);
  }
  const acc = /(\d{1,2}[.,]\d)\s?(s|sek|sekunden|sec)\b/gi;
  while ((m = acc.exec(text))) {
    const v = Number(m[1].replace(",", "."));
    if (v >= 1.5 && v <= 30) push("beschleunigung", v, "s", m);
  }
  return out.slice(0, 12);
}

export function toFinding(provider: string, title: string, url: string, snippet: string, retrievedAt: string): Finding {
  const clean = snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
  const c = classify(url, `${title} ${clean}`);
  const values = extractValues(`${title}. ${clean}`);
  return {
    id: `${provider}:${url}`,
    provider,
    title: title.replace(/<[^>]+>/g, "").trim(),
    url,
    snippet: clean.slice(0, 420),
    grade: c.grade,
    gradeReason: c.reason,
    kind: c.kind,
    retrievedAt,
    measuredAt: values.some((v) => v.kind === "radleistung") ? "rad" : values.some((v) => v.kind === "leistung") ? (c.kind === "spezifikation" || c.grade === "C" ? "motor" : "unbekannt") : "unbekannt",
    values,
  };
}
