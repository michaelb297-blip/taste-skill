import { describe, expect, it } from "vitest";
import { allVehicles, getVehicle } from "@/lib/data/catalog";
import { evaluateConfig, slotsFor, stageConfig } from "@/lib/engine/components";
import { buildCurve, curveSpec } from "@/lib/engine/curves";
import { engineKind, resolveTuning } from "@/lib/engine/families";
import { profileResults, simulateConfig, simulateVehicle } from "@/lib/engine/simulate";
import { PROFILE_ORDER, STAGE_ORDER, type Vehicle } from "@/lib/types";

const sims = allVehicles().map((v) => simulateVehicle(v));
const ref = getVehicle("bmw-4er-g22-430i-245-rwd")!;

describe("Stage-Berechnung – Plausibilität über den gesamten Katalog", () => {
  it("liefert monotone, positive und begrenzte Leistungswerte", () => {
    for (const s of sims) {
      const id = s.vehicle.id;
      const kind = s.model.kind;
      let prevPs = 0;
      for (const st of STAGE_ORDER) {
        const r = s.stages[st];
        expect(r.ps, `${id} ${st} PS`).toBeGreaterThanOrEqual(prevPs);
        expect(r.nm, `${id} ${st} Nm`).toBeGreaterThanOrEqual(s.vehicle.torque.nm);
        expect(Math.abs(r.kw * 1.35962 - r.ps), `${id} ${st} kW/PS`).toBeLessThan(1.5);
        expect(r.psRange[0]).toBeLessThanOrEqual(r.ps);
        expect(r.psRange[1]).toBeGreaterThanOrEqual(r.ps);
        prevPs = r.ps;
      }
      const max = s.stages.stage3x.ps / s.vehicle.power.ps;
      // keine unendliche Leistungssteigerung
      if (kind === "na-petrol") expect(max, `${id} Sauger`).toBeLessThan(1.35);
      else if (kind === "ev" || kind === "hev" || kind === "fcev") expect(max, `${id} elektrisch`).toBe(1);
      else expect(max, `${id} aufgeladen`).toBeLessThan(2.8);
      // Saugmotor: Stage 1 darf keine turbo-typischen Sprünge machen
      if (kind === "na-petrol") expect(s.stages.stage1.gainPct, `${id} Stage 1`).toBeLessThan(7);
      // Drehmoment je Liter bleibt physikalisch plausibel
      const litres = (s.vehicle.engine.displacementCc ?? 0) / 1000;
      if (litres && kind !== "phev") expect(s.stages.stage3x.nm / litres, `${id} Nm/l`).toBeLessThan(420);
    }
  });

  it("liefert plausible Fahrleistungen ohne negative Zeiten", () => {
    for (const s of sims) {
      const id = s.vehicle.id;
      for (const st of STAGE_ORDER) {
        const r = s.stages[st];
        expect(r.acc0100.value, `${id} ${st} 0–100`).not.toBeNull();
        expect(r.acc0100.value!).toBeGreaterThan(1.5);
        expect(r.acc0100.value!).toBeLessThan(15);
        if (r.acc100200.value != null) expect(r.acc100200.value).toBeGreaterThan(2.5);
        if (r.acc80120.value != null) expect(r.acc80120.value).toBeGreaterThan(0.8);
        expect(r.vmaxUnlimited.value!).toBeGreaterThan(120);
        expect(r.vmaxUnlimited.value!, `${id} ${st} Vmax`).toBeLessThan(440);
        if (r.acc0100.lo != null) {
          expect(r.acc0100.lo).toBeLessThanOrEqual(r.acc0100.value!);
          expect(r.acc0100.hi!).toBeGreaterThanOrEqual(r.acc0100.value!);
        }
      }
      // mehr Leistung macht das Fahrzeug nicht langsamer
      expect(s.stages.stage1.acc0100.value!, `${id} Stage 1 vs. Serie`).toBeLessThanOrEqual(s.stages.stock.acc0100.value! + 0.05);
      expect(s.stages.stage3x.acc0100.value!, `${id} Stage 3X vs. Stage 1`).toBeLessThanOrEqual(s.stages.stage1.acc0100.value! + 0.05);
      expect(s.stages.stage3x.vmaxUnlimited.value!).toBeGreaterThanOrEqual(s.stages.stock.vmaxUnlimited.value! - 1);
    }
  });

  it("gibt in der Serienspalte die Herstellerangaben unverändert wieder", () => {
    for (const s of sims) {
      const v = s.vehicle;
      expect(s.stages.stock.ps).toBe(v.power.ps);
      expect(s.stages.stock.nm).toBe(v.torque.nm);
      if (v.performance.acc0100) {
        expect(s.stages.stock.acc0100.value).toBe(v.performance.acc0100);
        expect(s.stages.stock.acc0100.prov).toBe("katalog");
      } else expect(s.stages.stock.acc0100.prov).toBe("simuliert");
      if (v.performance.vmax) expect(s.stages.stock.vmax.value).toBe(v.performance.vmax);
    }
  });

  it("kalibriert das Fahrmodell nur moderat", () => {
    for (const s of sims) {
      expect(Math.abs(s.calibration.offset0100), `${s.vehicle.id} Korrektur`).toBeLessThanOrEqual(1.6);
      expect(s.calibration.cdA).toBeGreaterThan(0.4);
      expect(s.calibration.cdA).toBeLessThan(1.4);
    }
  });

  it("kennzeichnet Stage 3 Extreme als nicht straßenzulässig", () => {
    for (const s of sims) {
      if (!s.model.powerTuningAvailable) continue;
      const f = s.stages.stage3x.evaluation.flags;
      expect(f.trackOnly, s.vehicle.id).toBe(true);
      expect(f.notRoadLegal).toBe(true);
      expect(f.highMaintenance).toBe(true);
      expect(s.stages.stage1.evaluation.flags.trackOnly).toBe(false);
      expect(s.stages.stage3x.confidence).toBe("niedrig");
    }
  });
});

describe("Motorspezifische Modelle", () => {
  it("behandelt B48 und B58 unterschiedlich", () => {
    const b48 = resolveTuning(ref);
    const b58 = resolveTuning(getVehicle("bmw-3er-g20-m340i-xdrive")!);
    expect(b48.familyId).toBe("bmw-b48");
    expect(b58.familyId).toBe("bmw-b58");
    const g48 = b48.targets.stage3x.ps / ref.power.ps;
    const g58 = b58.targets.stage3x.ps / 374;
    expect(Math.abs(g48 - g58)).toBeGreaterThan(0.1);
    expect(b58.internalsNm).toBeGreaterThan(b48.internalsNm);
  });

  it("nutzt für EA888, M139, EA839 und 9A2 eigene Familien", () => {
    const ids = ["vw-golf-8-r", "mercedes-a45s-w177", "audi-rs5-f5", "porsche-911-992-carrera-s"].map((id) => resolveTuning(getVehicle(id)!).familyId);
    expect(new Set(ids).size).toBe(4);
    // M139 ist ab Werk hoch ausgereizt: kleinerer Stage-1-Zuwachs als beim EA888
    const m139 = simulateVehicle(getVehicle("mercedes-a45s-w177")!).stages.stage1.gainPct;
    const ea888 = simulateVehicle(getVehicle("vw-golf-8-gti")!).stages.stage1.gainPct;
    expect(m139).toBeLessThan(ea888);
  });

  it("fällt ohne Familienmodell auf eine konservative Schätzung zurück", () => {
    const m = resolveTuning(getVehicle("ford-fiesta-st-mk8")!);
    expect(m.generic).toBe(true);
    expect(m.confidence).toBe("niedrig");
    expect(m.basis).toBe("schaetzung");
    expect(m.notes.join(" ")).toMatch(/kein eigenes Motorfamilien-Modell/);
  });

  it("erkennt die Antriebsart", () => {
    expect(engineKind(getVehicle("vw-golf-8-gtd")!)).toBe("turbo-diesel");
    expect(engineKind(getVehicle("porsche-911-992-gt3")!)).toBe("na-petrol");
    expect(engineKind(getVehicle("tesla-model-3-performance-2024")!)).toBe("ev");
    expect(engineKind(getVehicle("bmw-3er-g20-330e")!)).toBe("phev");
    expect(engineKind(getVehicle("toyota-mirai-jpd20")!)).toBe("fcev");
  });
});

describe("Referenzsimulation BMW G22 430i", () => {
  const sim = simulateVehicle(ref);
  it("bildet die recherchierten Stage-1-Werte ab", () => {
    const s1 = sim.stages.stage1;
    expect(s1.ps).toBeGreaterThanOrEqual(285);
    expect(s1.ps).toBeLessThanOrEqual(305);
    expect(s1.psRange).toEqual([285, 305]);
    expect(s1.nm).toBeGreaterThanOrEqual(440);
    expect(s1.nm).toBeLessThanOrEqual(465);
    expect(s1.psProv).toBe("recherchiert");
    expect(sim.model.sources.length).toBeGreaterThanOrEqual(6);
    for (const src of sim.model.sources) expect(src.url).toMatch(/^https:\/\//);
  });
  it("wählt nur passende Hardware", () => {
    expect(Object.keys(sim.stages.stage1.config)).toEqual(["software"]);
    const s2 = sim.stages.stage2.evaluation.hardware.map((h) => h.slot);
    expect(s2).toEqual(expect.arrayContaining(["software", "intake", "intercooler", "exhaust"]));
    expect(s2).not.toContain("charger");
    expect(sim.stages.stage3s.config.charger).toBe("hybrid");
    expect(sim.stages.stage3x.config.internals).toBe("forged");
    // Getriebe nur aufrüsten, wenn das Drehmoment es verlangt
    expect(sim.stages.stage1.config.drivetrain).toBeUndefined();
  });
  it("begrenzt das Drehmoment auf Motor- und Getriebegrenzen", () => {
    expect(sim.stages.stage3s.nm).toBeLessThanOrEqual(sim.model.internalsNm);
    expect(sim.stages.stage3x.nm).toBeLessThanOrEqual(sim.model.internalsBuiltNm);
  });
  it("erzeugt Kennlinien, deren Maxima zu den Eckdaten passen", () => {
    for (const st of STAGE_ORDER) {
      const r = sim.stages[st];
      const maxPs = Math.max(...r.curve.map((p) => p.ps));
      const maxNm = Math.max(...r.curve.map((p) => p.nm));
      expect(Math.abs(maxPs - r.ps) / r.ps, `${st} PS`).toBeLessThan(0.02);
      expect(Math.abs(maxNm - r.nm) / r.nm, `${st} Nm`).toBeLessThan(0.02);
      expect(r.curve.every((p) => p.nm >= 0 && p.ps >= 0)).toBe(true);
    }
  });
});

describe("Kennlinien aller Antriebsarten", () => {
  it("treffen Nennleistung und Nenndrehmoment", () => {
    for (const v of allVehicles()) {
      const kind = engineKind(v);
      if (kind === "hev") continue; // Systemleistung ≠ Verbrenner-Kennlinie
      const c = buildCurve(curveSpec(v, kind, v.power.ps, v.torque.nm));
      const maxPs = Math.max(...c.map((p) => p.ps));
      const maxNm = Math.max(...c.map((p) => p.nm));
      expect(maxPs / v.power.ps, `${v.id} PS`).toBeGreaterThan(0.97);
      expect(maxPs / v.power.ps, `${v.id} PS`).toBeLessThan(1.03);
      expect(maxNm / v.torque.nm, `${v.id} Nm`).toBeGreaterThan(0.93);
      expect(maxNm / v.torque.nm, `${v.id} Nm`).toBeLessThan(1.01);
    }
  });
});

describe("Fahrprofile", () => {
  it("ändern die Charakteristik, nicht die Spitzenleistung", () => {
    const sim = simulateVehicle(ref);
    for (const st of STAGE_ORDER) {
      const p = profileResults(ref, sim.stages[st]);
      expect(Object.keys(p)).toEqual(PROFILE_ORDER);
      expect(p.eco.acc0100!).toBeGreaterThan(p.performance.acc0100!);
      expect(p.comfort.acc0100!).toBeGreaterThanOrEqual(p.sport.acc0100!);
      expect(p.eco.consumption!).toBeLessThan(p.daily.consumption!);
      expect(p.performance.consumption!).toBeGreaterThan(p.daily.consumption!);
      expect(p.eco.thermal).toBeLessThan(p.performance.thermal);
    }
    // Performance-Profil der Serie entspricht der Herstellerangabe
    expect(profileResults(ref, sim.stages.stock).performance.acc0100).toBe(ref.performance.acc0100);
  });
});

describe("Elektro- und Hybridfahrzeuge", () => {
  it("simulieren keine Turbo-Umbauten und keine erfundene Mehrleistung", () => {
    for (const id of ["tesla-model-3-performance-2024", "porsche-taycan-turbo-s-j1", "toyota-mirai-jpd20", "toyota-corolla-e210-20-hybrid"]) {
      const v = getVehicle(id)!;
      const sim = simulateVehicle(v);
      const slots = slotsFor(v, sim.model).map((s) => s.slot);
      expect(slots).not.toContain("charger");
      expect(slots).not.toContain("exhaust");
      expect(slots).not.toContain("fuel");
      for (const st of STAGE_ORDER) expect(sim.stages[st].ps).toBe(v.power.ps);
      expect(sim.model.powerTuningAvailable).toBe(false);
    }
  });
  it("schätzt die Reichweite aus Batterie und Verbrauch", () => {
    const sim = simulateVehicle(getVehicle("tesla-model-3-performance-2024")!);
    const r = sim.stages.stock.rangeKm!;
    expect(r.value!).toBeGreaterThan(400);
    expect(r.value!).toBeLessThan(650);
    expect(r.prov).toBe("simuliert");
    // Semi-Slicks kosten Reichweite
    expect(sim.stages.stage2.rangeKm!.value!).toBeLessThan(r.value!);
  });
  it("begrenzt die Höchstgeschwindigkeit bei fester Übersetzung", () => {
    const sim = simulateVehicle(getVehicle("porsche-taycan-turbo-s-j1")!);
    expect(sim.stages.stage3x.vmaxUnlimited.value).toBeLessThanOrEqual(260);
  });
});

describe("Tuning-Konfigurator", () => {
  const model = resolveTuning(ref);
  it("bewertet Komponenten als System statt sie zu addieren", () => {
    const dp = evaluateConfig(ref, model, { exhaust: "downpipe" });
    expect(dp.ps).toBe(ref.power.ps); // ohne Software kein Gewinn
    expect(dp.issues.some((i) => /Ohne Softwareanpassung/.test(i.text))).toBe(true);
    const s1 = evaluateConfig(ref, model, { software: "tune" });
    const s1dp = evaluateConfig(ref, model, { software: "tune", exhaust: "downpipe" });
    const s2 = evaluateConfig(ref, model, stageConfig(ref, model, "stage2"));
    expect(s1dp.ps).toBeGreaterThan(s1.ps);
    expect(s1dp.ps).toBeLessThan(s2.ps);
    expect(s1dp.limitedBy).toContain("Ansaugung");
  });
  it("erkennt unverträgliche Kombinationen", () => {
    const noSw = evaluateConfig(ref, model, { charger: "big" });
    expect(noSw.issues.some((i) => i.level === "error")).toBe(true);
    expect(noSw.ps).toBe(ref.power.ps);
    const starved = evaluateConfig(ref, model, { software: "dyno", charger: "big", intake: "sport", exhaust: "full", intercooler: "upgraded" });
    expect(starved.limitedBy).toContain("Kraftstoffsystem");
    expect(starved.ps).toBeLessThan(model.targets.stage3s.ps);
    expect(starved.issues.some((i) => /Kraftstoffsystem/.test(i.text))).toBe(true);
    const full = evaluateConfig(ref, model, { software: "dyno", charger: "big", intake: "sport", exhaust: "full", intercooler: "upgraded", fuel: "full" });
    expect(full.nm).toBeLessThanOrEqual(model.internalsNm);
    expect(full.limitedBy).toContain("Rumpfmotor (Drehmoment)");
  });
  it("führt keine Komponente doppelt und rechnet Kosten konsistent", () => {
    for (const v of allVehicles()) {
      const m = resolveTuning(v);
      for (const st of STAGE_ORDER) {
        const e = evaluateConfig(v, m, stageConfig(v, m, st));
        const slots = e.hardware.map((h) => h.slot);
        expect(new Set(slots).size, `${v.id} ${st}`).toBe(slots.length);
        const c = e.costs;
        expect(c.total[0]).toBe(c.material[0] + c.labor[0] + c.tuning[0]);
        expect(c.total[1]).toBe(c.material[1] + c.labor[1] + c.tuning[1]);
        expect(c.total[1]).toBeGreaterThanOrEqual(c.total[0]);
        if (st === "stock") expect(c.total[1]).toBe(0);
      }
      const s1 = evaluateConfig(v, m, stageConfig(v, m, "stage1")).costs.total[1];
      const s3 = evaluateConfig(v, m, stageConfig(v, m, "stage3x")).costs.total[0];
      expect(s3, `${v.id} Kostenreihenfolge`).toBeGreaterThan(s1);
    }
  });
  it("bietet keine Deaktivierung von Abgas- oder Sicherheitssystemen an", () => {
    for (const v of allVehicles()) {
      for (const s of slotsFor(v, resolveTuning(v)))
        for (const o of s.options) expect(`${o.name} ${o.description}`, v.id).not.toMatch(/ohne Kat|Decat|DPF[- ]?(off|delete|entfern)|AGR[- ]?(off|delete)|AdBlue[- ]?off/i);
    }
  });
  it("simuliert eine freie Konfiguration", () => {
    const r = simulateConfig(ref, { software: "tune", exhaust: "downpipe", intake: "sport" });
    expect(r.stage).toBe("custom");
    expect(r.ps).toBeGreaterThan(290);
    expect(r.acc0100.value!).toBeLessThan(ref.performance.acc0100!);
    expect(r.evaluation.issues.some((i) => /Ladeluftkühler/.test(i.text))).toBe(true);
  });
});

describe("Nutzerdefinierte Fahrzeuge", () => {
  it("lassen sich mit Minimaldaten simulieren", () => {
    const custom: Vehicle = {
      id: "custom:test", brand: "Dacia", model: "Duster", generation: "", body: "suv", yearFrom: 2022, yearTo: null, variant: "Duster TCe 150", custom: true,
      engine: { name: "1.3 TCe", displacementCc: 1332, cylinders: 4, induction: "turbo", fuel: "petrol", hybrid: "none" },
      power: { ps: 150, kw: 110 }, torque: { nm: 250 }, performance: {}, gearbox: { type: "dct", gears: 6 }, drive: "FWD", weightKg: 1300,
    };
    const sim = simulateVehicle(custom);
    expect(sim.model.generic).toBe(true);
    expect(sim.stages.stock.acc0100.prov).toBe("simuliert");
    expect(sim.stages.stock.acc0100.value!).toBeGreaterThan(6);
    expect(sim.stages.stock.acc0100.value!).toBeLessThan(13);
    expect(sim.stages.stage1.ps).toBeGreaterThan(150);
    expect(sim.assumptions.length).toBeGreaterThan(3);
  });
});
