import { describe, expect, it } from "vitest";
import { BRANDS } from "@/lib/data/brands";
import { allVehicles, getVehicle, selectionOptions, variantKey } from "@/lib/data/catalog";
import { parseQuery, searchVehicles } from "@/lib/data/search";
import { vehicleSchema } from "@/lib/vehicle-schema";

describe("Fahrzeugdatenbank", () => {
  it("enthält mindestens 100 eigenständige Marken ohne Dubletten", () => {
    expect(BRANDS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(BRANDS.map((b) => b.id)).size).toBe(BRANDS.length);
    expect(new Set(BRANDS.map((b) => b.name.toLowerCase())).size).toBe(BRANDS.length);
    for (const b of BRANDS) {
      expect(b.models.length, b.name).toBeGreaterThan(0);
      expect(new Set(b.models).size, `${b.name}: doppelte Baureihe`).toBe(b.models.length);
    }
  });

  it("hat eindeutige IDs und jede Marke eines Datensatzes steht im Verzeichnis", () => {
    const vs = allVehicles();
    expect(new Set(vs.map((v) => v.id)).size).toBe(vs.length);
    const names = new Set(BRANDS.map((b) => b.name));
    for (const v of vs) expect(names.has(v.brand), v.id).toBe(true);
  });

  it("besteht die Plausibilitätsprüfung für jeden Datensatz", () => {
    for (const v of allVehicles()) {
      const r = vehicleSchema.safeParse(v);
      expect(r.success, `${v.id}: ${r.success ? "" : JSON.stringify(r.error.issues[0])}`).toBe(true);
      // Einheiten: kW und PS müssen zusammenpassen
      expect(Math.abs(v.power.kw * 1.35962 - v.power.ps) / v.power.ps, `${v.id} kW/PS`).toBeLessThan(0.02);
      if (v.yearTo != null) expect(v.yearTo).toBeGreaterThanOrEqual(v.yearFrom);
      if (v.power.rpmFrom && v.power.rpmTo) expect(v.power.rpmTo).toBeGreaterThanOrEqual(v.power.rpmFrom);
      if (v.gearbox.ratios) expect(v.gearbox.ratios.length, `${v.id} Gangzahl`).toBe(v.gearbox.gears);
      if (v.engine.fuel === "electric") expect(v.engine.induction).toBe("electric");
    }
  });

  it("führt die mehrstufige Auswahl bis zu genau einem Fahrzeug", () => {
    expect(selectionOptions({}).step).toBe("brand");
    expect(selectionOptions({ brand: "BMW" }).options).toContain("4er");
    expect(selectionOptions({ brand: "BMW", model: "4er" }).options).toEqual(["G22"]);
    const years = selectionOptions({ brand: "BMW", model: "4er", generation: "G22" });
    expect(years.step).toBe("year");
    expect(years.options).toContain("2022");
    const variants = selectionOptions({ brand: "BMW", model: "4er", generation: "G22", year: 2022 });
    expect(variants.options.some((o) => o.includes("430i") && o.includes("245 PS"))).toBe(true);
    // 2022 gab es die 258-PS-Variante nicht mehr
    expect(variants.options.some((o) => o.includes("258 PS"))).toBe(false);
    const v = getVehicle("bmw-4er-g22-430i-245-rwd")!;
    const gear = selectionOptions({ brand: "BMW", model: "4er", generation: "G22", year: 2022, variant: variantKey(v) });
    expect(gear.step).toBe("gearbox");
    const done = selectionOptions({ brand: "BMW", model: "4er", generation: "G22", year: 2022, variant: variantKey(v), gearbox: gear.options[0], drive: "RWD" });
    expect(done.step).toBe("done");
    expect(done.matches.map((m) => m.id)).toEqual(["bmw-4er-g22-430i-245-rwd"]);
  });
});

describe("Freitextsuche", () => {
  it("zerlegt natürliche Sprache", () => {
    const p = parseQuery("BMW G22 2022 430i 249 PS");
    expect(p).toMatchObject({ brand: "BMW", year: 2022, ps: 249 });
    expect(p.tokens).toEqual(["g22", "430i"]);
    expect(parseQuery("vw golf r 320ps allrad").brand).toBe("Volkswagen");
    expect(parseQuery("Mercedes C 220 d diesel 147 kW")).toMatchObject({ brand: "Mercedes-Benz", fuel: "diesel", kw: 147 });
  });

  it("findet das Referenzfahrzeug und weist auf die nicht belegten 249 PS hin", () => {
    const r = searchVehicles("BMW G22 2022 430i 249 PS");
    expect(r.hits[0].vehicle.generation).toBe("G22");
    expect(r.hits[0].vehicle.power.ps).toBe(245);
    expect(r.hits[0].vehicle.yearFrom).toBeLessThanOrEqual(2022);
    expect(r.hints.join(" ")).toMatch(/249 PS nicht belegt/);
  });

  it("schlägt Baureihen ohne Datensatz vor und erfindet keine Treffer", () => {
    const r = searchVehicles("Dacia Duster");
    expect(r.hits).toHaveLength(0);
    expect(r.catalogOnly).toContainEqual({ brand: "Dacia", model: "Duster" });
    const none = searchVehicles("xyzzy quux");
    expect(none.hits).toHaveLength(0);
    expect(none.hints[0]).toMatch(/Kein Treffer/);
    expect(searchVehicles("").hits).toHaveLength(0);
  });

  it("berücksichtigt Antrieb und Kraftstoff", () => {
    expect(searchVehicles("BMW 430i xDrive").hits[0].vehicle.drive).toBe("AWD");
    expect(searchVehicles("Golf diesel").hits[0].vehicle.engine.fuel).toBe("diesel");
  });
});
