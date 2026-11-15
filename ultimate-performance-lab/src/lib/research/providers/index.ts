import { resolveTuning } from "../../engine/families";
import { toFinding } from "../classify";
import type { Finding, ResearchProvider, ResearchQuery } from "../types";

const UA = () => `UltimatePerformanceLab/0.1 (${process.env.RESEARCH_USER_AGENT_CONTACT || "local development"})`;

async function getJson(url: string, init: RequestInit, signal: AbortSignal): Promise<any> {
  const res = await fetch(url, { ...init, signal, headers: { Accept: "application/json", "User-Agent": UA(), ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Belege, die bereits am Fahrzeugdatensatz hängen. */
const localCatalog: ResearchProvider = {
  id: "katalog",
  label: "Lokale Fahrzeugdatenbank",
  type: "lokal",
  isConfigured: () => true,
  async search({ vehicle }) {
    return (vehicle.sources ?? []).map<Finding>((s) => ({
      id: `katalog:${s.url}`, provider: "katalog", title: s.title, url: s.url, snippet: s.note ?? "", grade: s.grade,
      gradeReason: "Redaktionell hinterlegte Quelle zum Fahrzeugdatensatz", kind: "spezifikation", retrievedAt: s.retrievedAt, measuredAt: "motor", values: [], curated: true,
    }));
  },
};

/** Redaktionell recherchierte Tuning-Belege der Motorfamilie. */
const curated: ResearchProvider = {
  id: "redaktion",
  label: "Redaktionelle Tuning-Recherche",
  type: "lokal",
  isConfigured: () => true,
  async search({ vehicle }) {
    return resolveTuning(vehicle).sources.map<Finding>((s) => ({
      id: `redaktion:${s.url}`, provider: "redaktion", title: s.title, url: s.url, snippet: s.note ?? "", grade: s.grade,
      gradeReason: s.grade === "C" ? "Dokumentierte Tunerangabe (nicht unabhängig gemessen)" : s.grade === "D" ? "Erfahrungsbericht aus der Community" : "Einschätzung aus Fachartikel/Ratgeber, keine Messung",
      kind: s.grade === "D" ? "erfahrung" : "tuning", retrievedAt: s.retrievedAt, measuredAt: /whp|Radleistung/i.test(s.note ?? "") ? "rad" : "motor", values: [], curated: true,
    }));
  },
};

const wikipedia: ResearchProvider = {
  id: "wikipedia",
  label: "Wikipedia (DE/EN)",
  type: "frei",
  isConfigured: () => true,
  async search({ vehicle }, signal) {
    const now = new Date().toISOString();
    const q = `${vehicle.brand} ${vehicle.model} ${vehicle.generation}`;
    const out: Finding[] = [];
    for (const lang of ["de", "en"]) {
      const data = await getJson(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=${encodeURIComponent(q)}`, {}, signal);
      for (const r of data?.query?.search ?? [])
        out.push(toFinding("wikipedia", `${r.title} – Wikipedia (${lang.toUpperCase()})`, `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(r.title).replace(/ /g, "_"))}`, r.snippet ?? "", now));
    }
    return out;
  },
};

const brave: ResearchProvider = {
  id: "brave",
  label: "Brave Search API",
  type: "api",
  envVar: "BRAVE_SEARCH_API_KEY",
  isConfigured: () => !!process.env.BRAVE_SEARCH_API_KEY,
  async search({ queries }, signal) {
    const now = new Date().toISOString();
    const out: Finding[] = [];
    for (const q of queries) {
      const data = await getJson(`https://api.search.brave.com/res/v1/web/search?count=8&q=${encodeURIComponent(q)}`, { headers: { "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY! } }, signal);
      for (const r of data?.web?.results ?? []) out.push(toFinding("brave", r.title ?? "", r.url ?? "", r.description ?? "", now));
    }
    return out;
  },
};

const tavily: ResearchProvider = {
  id: "tavily",
  label: "Tavily Search API",
  type: "api",
  envVar: "TAVILY_API_KEY",
  isConfigured: () => !!process.env.TAVILY_API_KEY,
  async search({ queries }, signal) {
    const now = new Date().toISOString();
    const out: Finding[] = [];
    for (const q of queries) {
      const data = await getJson("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TAVILY_API_KEY}` }, body: JSON.stringify({ query: q, max_results: 6 }) }, signal);
      for (const r of data?.results ?? []) out.push(toFinding("tavily", r.title ?? "", r.url ?? "", r.content ?? "", now));
    }
    return out;
  },
};

const searxng: ResearchProvider = {
  id: "searxng",
  label: "SearXNG (eigene Instanz)",
  type: "api",
  envVar: "SEARXNG_URL",
  isConfigured: () => !!process.env.SEARXNG_URL,
  async search({ queries }, signal) {
    const now = new Date().toISOString();
    const out: Finding[] = [];
    const base = process.env.SEARXNG_URL!.replace(/\/$/, "");
    for (const q of queries) {
      const data = await getJson(`${base}/search?format=json&q=${encodeURIComponent(q)}`, {}, signal);
      for (const r of (data?.results ?? []).slice(0, 8)) out.push(toFinding("searxng", r.title ?? "", r.url ?? "", r.content ?? "", now));
    }
    return out;
  },
};

/** Registrierte Datenquellen – neue Anbieter hier ergänzen. */
export const PROVIDERS: ResearchProvider[] = [localCatalog, curated, wikipedia, brave, tavily, searxng];

export function buildQueries(q: ResearchQuery["vehicle"]): string[] {
  const base = `${q.brand} ${q.variant} ${q.generation}`.replace(new RegExp(`(${q.brand} )+`, "g"), `${q.brand} `);
  const code = q.engine.code ? ` ${q.engine.code}` : "";
  const electric = q.engine.fuel === "electric";
  return [
    `${base} technische Daten ${q.power.ps} PS`,
    electric ? `${base} Leistungssteigerung Software Upgrade` : `${base}${code} Stage 1 Leistungssteigerung Prüfstand`,
    electric ? `${base} 0-100 Messung Test` : `${base}${code} Stage 2 dyno whp`,
  ];
}
