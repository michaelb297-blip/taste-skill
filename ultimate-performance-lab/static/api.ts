/** Beantwortet die /api-Aufrufe der Oberfläche direkt im Browser (keine Server-Version). */
import { allVehicles, brandSummaries, getVehicle, selectionOptions, type Selection } from "@/lib/data/catalog";
import { searchVehicles } from "@/lib/data/search";
import { PROVIDERS } from "@/lib/research/providers";
import type { Finding, ProviderStatus } from "@/lib/research/types";
import type { Vehicle } from "@/lib/types";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const NO_SERVER = "In dieser privaten Web-App-Version nicht verfügbar (läuft ohne Server).";

async function handle(url: URL, init?: RequestInit): Promise<Response> {
  const p = url.pathname;
  const q = url.searchParams;
  const body = init?.body ? (JSON.parse(String(init.body)) as { vehicleId?: string; vehicle?: Vehicle }) : {};
  if (p === "/api/vehicles/search") return json(searchVehicles(q.get("q") ?? ""));
  if (p === "/api/vehicles/brands") {
    const brands = brandSummaries();
    return json({ brands, totals: { brands: brands.length, models: brands.reduce((a, b) => a + b.models.length, 0), variants: allVehicles().length } });
  }
  if (p === "/api/vehicles/select") {
    const sel: Selection = { brand: q.get("brand") || undefined, model: q.get("model") || undefined, generation: q.get("generation") || undefined, year: q.get("year") ? Number(q.get("year")) : undefined, variant: q.get("variant") || undefined, gearbox: q.get("gearbox") || undefined, drive: q.get("drive") || undefined };
    const r = selectionOptions(sel);
    return json({ step: r.step, options: r.options, matches: r.matches.map((v) => v.id), count: r.matches.length });
  }
  if (p.startsWith("/api/vehicles/")) {
    const v = getVehicle(decodeURIComponent(p.slice("/api/vehicles/".length)));
    return v ? json(v) : json({ error: "Fahrzeug nicht gefunden." }, 404);
  }
  if (p === "/api/research") {
    const v = body.vehicle ?? (body.vehicleId ? getVehicle(body.vehicleId) : undefined);
    if (!v) return json({ error: "Fahrzeug nicht gefunden." }, 404);
    const findings: Finding[] = [];
    const providers: ProviderStatus[] = [];
    for (const pr of PROVIDERS) {
      if (pr.type === "lokal") {
        const f = await pr.search({ vehicle: v, queries: [] }, new AbortController().signal);
        findings.push(...f);
        providers.push({ id: pr.id, label: pr.label, type: pr.type, configured: true, ok: true, count: f.length, message: f.length ? `${f.length} Fundstellen` : "Keine Fundstellen" });
      } else providers.push({ id: pr.id, label: pr.label, type: pr.type, configured: false, ok: false, count: 0, message: NO_SERVER });
    }
    return json({ vehicleId: v.id, generatedAt: new Date().toISOString(), live: false, fromCache: false, providers, findings, notice: "Diese Version läuft ohne Server und kann nicht live im Internet recherchieren. Angezeigt werden die hinterlegten, redaktionell recherchierten Belege." });
  }
  if (p === "/api/images") return json({ vehicleId: body.vehicleId ?? "", live: false, fromCache: false, images: [], notice: "Fahrzeugfotos lassen sich in dieser Version nicht laden." });
  if (p === "/api/auth/me") return json({ user: null });
  if (p === "/api/health")
    return json({ database: { mode: "browser", status: "ok" }, providers: PROVIDERS.map((x) => ({ id: x.id, label: x.label, type: x.type, configured: x.type === "lokal", envVar: x.type === "lokal" ? undefined : "nur in der Server-Version" })), mail: { configured: false } });
  return json({ error: NO_SERVER }, 501);
}

const realFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (raw.startsWith("/api/")) return handle(new URL(raw, "https://app.local"), init);
  return realFetch(input, init);
};
