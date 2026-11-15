import { describe, expect, it } from "vitest";
process.env.PGLITE_DIR = "memory";
import { getVehicle } from "@/lib/data/catalog";
import { research, vehicleImages } from "@/lib/research";
import { classify, extractValues, toFinding } from "@/lib/research/classify";
import { buildQueries, PROVIDERS } from "@/lib/research/providers";
import type { ResearchProvider } from "@/lib/research/types";

const ref = getVehicle("bmw-4er-g22-430i-245-rwd")!;
const local = PROVIDERS.filter((p) => p.type === "lokal");

describe("Quellenbewertung", () => {
  it("ordnet Domains den Stufen A–F zu", () => {
    expect(classify("https://www.press.bmwgroup.com/x", "Technische Daten").grade).toBe("A");
    expect(classify("https://www.adac.de/x", "430i").grade).toBe("A");
    expect(classify("https://chiptuning-beispiel.de/bmw", "Stage 1 305 PS").grade).toBe("C");
    expect(classify("https://g20.bimmerpost.com/forums/x", "my car made 280 whp on the dyno").grade).toBe("D");
    expect(classify("https://g20.bimmerpost.com/forums/x", "dyno 280 whp").kind).toBe("pruefstand");
    expect(classify("https://example.org/blog", "irgendwas").grade).toBe("F");
    expect(classify("kaputt", "x").grade).toBe("F");
  });
  it("vergibt automatisch nie die Stufe B (gemessener Prüfstandswert)", () => {
    for (const [u, t] of [["https://forum.x.de/a", "Prüfstand 300 PS gemessen"], ["https://tuning.x.de/a", "Leistungsmessung dyno"], ["https://x.de/a", "Stage 1 dyno measured 290 whp"]])
      expect(classify(u, t).grade).not.toBe("B");
  });
  it("extrahiert Werte und unterscheidet Rad- von Motorleistung", () => {
    const v = extractValues("Stage 1: 305 PS und 465 Nm, auf dem Dyno 262 whp, 0-100 in 5,1 s");
    expect(v).toContainEqual(expect.objectContaining({ kind: "leistung", value: 305, unit: "PS" }));
    expect(v).toContainEqual(expect.objectContaining({ kind: "drehmoment", value: 465, unit: "Nm" }));
    expect(v).toContainEqual(expect.objectContaining({ kind: "radleistung", value: 262 }));
    expect(v).toContainEqual(expect.objectContaining({ kind: "beschleunigung", value: 5.1 }));
    expect(toFinding("t", "x", "https://forum.x.de/1", "made 262 whp", "2026-01-01").measuredAt).toBe("rad");
    expect(extractValues("Baujahr 2022, 4 Türen")).toHaveLength(0);
  });
  it("bereinigt HTML in Fundstellen", () => {
    const f = toFinding("t", "<b>BMW</b> 430i", "https://x.de", 'Leistung <span class="m">245 PS</span> &amp; 400 Nm', "2026-01-01");
    expect(f.title).toBe("BMW 430i");
    expect(f.snippet).toBe("Leistung 245 PS & 400 Nm");
  });
});

describe("Recherche-Orchestrierung", () => {
  it("liefert ohne Online-Quelle die hinterlegten Belege und sagt das offen", async () => {
    const r = await research(ref, { providers: local });
    expect(r.live).toBe(false);
    expect(r.notice).toMatch(/Keine Online-Quelle konfiguriert/);
    expect(r.findings.length).toBeGreaterThanOrEqual(10);
    expect(r.findings.every((f) => f.curated && /^https:\/\//.test(f.url))).toBe(true);
    expect(r.findings.some((f) => f.grade === "C")).toBe(true);
    expect(r.findings.some((f) => f.measuredAt === "rad")).toBe(true);
  });
  it("meldet ausgefallene und nicht konfigurierte Quellen transparent", async () => {
    const down: ResearchProvider = { id: "down", label: "Ausgefallen", type: "frei", isConfigured: () => true, search: async () => { throw new Error("getaddrinfo ENOTFOUND"); } };
    const nokey: ResearchProvider = { id: "nokey", label: "Ohne Schlüssel", type: "api", envVar: "X_KEY", isConfigured: () => false, search: async () => [] };
    const r = await research(ref, { providers: [...local, down, nokey] });
    expect(r.live).toBe(false);
    expect(r.notice).toMatch(/nicht möglich/);
    expect(r.providers.find((p) => p.id === "down")).toMatchObject({ ok: false, configured: true });
    expect(r.providers.find((p) => p.id === "down")!.message).toMatch(/ENOTFOUND/);
    expect(r.providers.find((p) => p.id === "nokey")!.message).toMatch(/X_KEY/);
  });
  it("führt Live-Fundstellen zusammen und entfernt Dubletten", async () => {
    const now = new Date().toISOString();
    const live: ResearchProvider = {
      id: "live", label: "Testquelle", type: "api", isConfigured: () => true,
      search: async () => [
        toFinding("live", "430i Stage 1", "https://tuning.example/430i", "Stage 1 300 PS 460 Nm", now),
        toFinding("live", "430i Stage 1 (Dublette)", "https://tuning.example/430i/", "Stage 1 300 PS", now),
        toFinding("live", "Schon hinterlegt", ref.sources![0].url, "x", now),
      ],
    };
    const r = await research(ref, { providers: [...local, live] });
    expect(r.live).toBe(true);
    expect(r.findings.filter((f) => f.url.startsWith("https://tuning.example/430i"))).toHaveLength(1);
    expect(r.findings.filter((f) => f.url === ref.sources![0].url)).toHaveLength(1);
    // redaktionelle Belege stehen vor automatischen Fundstellen
    expect(r.findings[0].curated).toBe(true);
  });
  it("baut fahrzeugspezifische Suchanfragen", () => {
    const q = buildQueries(ref);
    expect(q[0]).toMatch(/BMW 430i Coupé G22 technische Daten 245 PS/);
    expect(q[1]).toMatch(/B48B20 Stage 1/);
    expect(buildQueries(getVehicle("tesla-model-3-performance-2024")!).join(" ")).not.toMatch(/Stage 2 dyno/);
  });
});

describe("Fahrzeugbilder", () => {
  it("übernimmt nur frei lizenzierte Bilder mit Urheberangabe", async () => {
    const page = (title: string, lic: string) => ({ title: `File:${title}`, imageinfo: [{ thumburl: `https://upload.wikimedia.org/${title}`, descriptionurl: `https://commons.wikimedia.org/wiki/File:${title}`, extmetadata: { LicenseShortName: { value: lic }, Artist: { value: "<a>Foto Grafin</a>" } } }] });
    const fake = (async () => new Response(JSON.stringify({ query: { pages: { 1: page("a.jpg", "CC BY-SA 4.0"), 2: page("b.jpg", "All rights reserved") } } }))) as unknown as typeof fetch;
    const r = await vehicleImages({ ...ref, custom: true }, fake);
    expect(r.live).toBe(true);
    expect(r.images).toHaveLength(1);
    expect(r.images[0]).toMatchObject({ license: "CC BY-SA 4.0", author: "Foto Grafin" });
  });
  it("fällt bei nicht erreichbarer Bildquelle transparent zurück", async () => {
    const fake = (async () => { throw new Error("ENOTFOUND"); }) as unknown as typeof fetch;
    const r = await vehicleImages({ ...ref, custom: true }, fake);
    expect(r.live).toBe(false);
    expect(r.images).toHaveLength(0);
    expect(r.notice).toMatch(/neutrale Fahrzeugdarstellung/);
  });
});
