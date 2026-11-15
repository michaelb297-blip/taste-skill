import type { Vehicle } from "../types";
import { cacheGet, cacheSet } from "../db/cache";
import { buildQueries, PROVIDERS } from "./providers";
import type { Finding, ImageReport, ProviderStatus, ResearchProvider, ResearchReport, VehicleImage } from "./types";

const TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const GRADE_RANK: Record<string, number> = { B: 0, A: 1, C: 2, D: 3, E: 4, F: 5 };

async function runProvider(p: ResearchProvider, vehicle: Vehicle): Promise<{ status: ProviderStatus; findings: Finding[] }> {
  const base = { id: p.id, label: p.label, type: p.type, envVar: p.envVar };
  if (!p.isConfigured())
    return { status: { ...base, configured: false, ok: false, count: 0, message: `Nicht konfiguriert${p.envVar ? ` – Umgebungsvariable ${p.envVar} fehlt` : ""}.` }, findings: [] };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const findings = await p.search({ vehicle, queries: buildQueries(vehicle) }, ctrl.signal);
    return { status: { ...base, configured: true, ok: true, count: findings.length, message: findings.length ? `${findings.length} Fundstellen` : "Keine Fundstellen" }, findings };
  } catch (err) {
    const msg = ctrl.signal.aborted ? `Zeitüberschreitung nach ${TIMEOUT_MS / 1000} s` : err instanceof Error ? (err.cause instanceof Error ? err.cause.message : err.message) : "Unbekannter Fehler";
    return { status: { ...base, configured: true, ok: false, count: 0, message: `Nicht erreichbar: ${msg}` }, findings: [] };
  } finally {
    clearTimeout(timer);
  }
}

/** Führt alle Datenquellen parallel aus, dedupliziert und bewertet die Fundstellen. */
export async function research(vehicle: Vehicle, opts: { refresh?: boolean; providers?: ResearchProvider[] } = {}): Promise<ResearchReport> {
  const key = `research:${vehicle.id}`;
  if (!opts.refresh && !opts.providers && !vehicle.custom) {
    const hit = await cacheGet<ResearchReport>(key, TTL_MS);
    if (hit) return { ...hit, fromCache: true };
  }
  const results = await Promise.all((opts.providers ?? PROVIDERS).map((p) => runProvider(p, vehicle)));
  const seen = new Set<string>();
  const findings: Finding[] = [];
  for (const r of results)
    for (const f of r.findings) {
      const k = f.url.replace(/[#?].*$/, "").replace(/\/$/, "");
      if (!f.url || seen.has(k)) continue;
      seen.add(k);
      findings.push(f);
    }
  findings.sort((a, b) => Number(!!b.curated) - Number(!!a.curated) || GRADE_RANK[a.grade] - GRADE_RANK[b.grade]);
  const providers = results.map((r) => r.status);
  const liveOk = providers.some((p) => p.type !== "lokal" && p.ok);
  const liveTried = providers.filter((p) => p.type !== "lokal" && p.configured);
  const notice = liveOk
    ? "Live-Recherche durchgeführt. Automatisch gefundene Werte sind Fundstellen, keine geprüften Messwerte – bitte die verlinkte Quelle prüfen."
    : liveTried.length
      ? "Live-Recherche derzeit nicht möglich: Die konfigurierten Online-Quellen waren nicht erreichbar. Angezeigt werden nur lokal hinterlegte, redaktionell recherchierte Belege."
      : "Keine Online-Quelle konfiguriert. Angezeigt werden nur lokal hinterlegte Belege.";
  const report: ResearchReport = { vehicleId: vehicle.id, generatedAt: new Date().toISOString(), live: liveOk, fromCache: false, providers, findings, notice };
  if (liveOk && !opts.providers && !vehicle.custom) await cacheSet(key, report);
  return report;
}

const VIEWS: { view: VehicleImage["view"]; suffix: string }[] = [
  { view: "aussen", suffix: "" },
  { view: "heck", suffix: " rear" },
  { view: "innenraum", suffix: " interior" },
  { view: "motorraum", suffix: " engine" },
];

/** Fahrzeugbilder aus Wikimedia Commons (frei lizenziert, mit Urheber- und Lizenzangabe). */
export async function vehicleImages(vehicle: Vehicle, fetchImpl: typeof fetch = fetch): Promise<ImageReport> {
  const key = `images:${vehicle.id}`;
  if (!vehicle.custom) {
    const hit = await cacheGet<ImageReport>(key, 7 * TTL_MS);
    if (hit) return { ...hit, fromCache: true };
  }
  const base = `${vehicle.brand} ${vehicle.model} ${vehicle.generation.replace(/\(.*\)/, "").trim()}`;
  const ua = `UltimatePerformanceLab/0.1 (${process.env.RESEARCH_USER_AGENT_CONTACT || "local development"})`;
  const images: VehicleImage[] = [];
  const strip = (s: string | undefined) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  try {
    await Promise.all(
      VIEWS.map(async ({ view, suffix }) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
          const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=${view === "aussen" ? 4 : 2}&gsrsearch=${encodeURIComponent(`${base}${suffix} filetype:bitmap`)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960`;
          const res = await fetchImpl(url, { signal: ctrl.signal, headers: { "User-Agent": ua, Accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: any = await res.json();
          for (const page of Object.values<any>(data?.query?.pages ?? {})) {
            const ii = page.imageinfo?.[0];
            const meta = ii?.extmetadata ?? {};
            const license = strip(meta.LicenseShortName?.value);
            // nur Bilder mit eindeutig freier Lizenz
            if (!ii?.thumburl || !/^(CC|Public domain|PD|GFDL|FAL)/i.test(license)) continue;
            images.push({ view, title: String(page.title ?? "").replace(/^File:/, ""), thumbUrl: ii.thumburl, pageUrl: ii.descriptionurl, author: strip(meta.Artist?.value) || "Unbekannt", license, licenseUrl: meta.LicenseUrl?.value });
          }
        } finally {
          clearTimeout(timer);
        }
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? (err.cause instanceof Error ? err.cause.message : err.message) : "unbekannter Fehler";
    return { vehicleId: vehicle.id, live: false, fromCache: false, images: [], notice: `Bildquelle Wikimedia Commons nicht erreichbar (${msg}). Es wird eine neutrale Fahrzeugdarstellung verwendet.` };
  }
  const uniq = images.filter((img, i) => images.findIndex((x) => x.pageUrl === img.pageUrl) === i);
  const report: ImageReport = {
    vehicleId: vehicle.id, live: true, fromCache: false, images: uniq,
    notice: uniq.length ? "Bilder aus Wikimedia Commons. Die Zuordnung zum Modell erfolgt über die Bildsuche und kann abweichen." : "Keine frei lizenzierten Bilder gefunden. Es wird eine neutrale Fahrzeugdarstellung verwendet.",
  };
  if (!vehicle.custom) await cacheSet(key, report);
  return report;
}
