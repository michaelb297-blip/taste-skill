"use client";

import { useState } from "react";
import type { Body, Drive, Fuel, GearboxType, Hybrid, Induction, Vehicle } from "@/lib/types";
import { vehicleSchema } from "@/lib/vehicle-schema";
import { Button, Field, inputCls, Notice } from "./ui";

const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));

/** Eigenes Fahrzeug anlegen: Nur eingegebene Werte werden verwendet, der Rest als Annahme gekennzeichnet. */
export function VehicleForm({ initialBrand = "", initialModel = "", onSave }: { initialBrand?: string; initialModel?: string; onSave: (v: Vehicle) => void }) {
  const [f, setF] = useState({
    brand: initialBrand, model: initialModel, generation: "", variant: "", year: String(new Date().getFullYear()), body: "hatch" as Body,
    fuel: "petrol" as Fuel, hybrid: "none" as Hybrid, induction: "turbo" as Induction, cc: "", cyl: "4", ps: "", nm: "", weight: "",
    drive: "FWD" as Drive, gearbox: "manual" as GearboxType, gears: "6", vmax: "", limited: false, acc: "", cons: "", battery: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const electric = f.fuel === "electric" || f.fuel === "hydrogen";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ps = num(f.ps);
    const year = num(f.year);
    const cons = num(f.cons);
    const candidate = {
      id: `custom:${crypto.randomUUID()}`,
      brand: f.brand.trim(), model: f.model.trim(), generation: f.generation.trim(), body: f.body, yearFrom: year, yearTo: null,
      variant: f.variant.trim() || f.model.trim(), custom: true,
      engine: {
        name: electric ? "Elektroantrieb (Nutzereingabe)" : `${f.cc ? `${(Number(f.cc) / 1000).toFixed(1)} l ` : ""}${f.induction === "na" ? "Saugmotor" : f.induction === "supercharger" ? "Kompressor" : "Turbo"} (Nutzereingabe)`,
        displacementCc: electric ? undefined : num(f.cc), cylinders: electric ? undefined : num(f.cyl),
        induction: electric ? "electric" : f.induction, fuel: f.fuel, hybrid: electric ? "none" : f.hybrid,
      },
      power: { ps, kw: ps ? Math.round(ps / 1.35962) : undefined },
      torque: { nm: num(f.nm) },
      performance: { vmax: num(f.vmax), vmaxLimited: f.vmax ? f.limited : undefined, acc0100: num(f.acc) },
      gearbox: electric ? { type: "single-speed", gears: 1 } : { type: f.gearbox, gears: f.gearbox === "cvt" ? 1 : num(f.gears) },
      drive: f.drive, weightKg: num(f.weight),
      consumption: cons ? { value: cons, unit: f.fuel === "electric" ? "kWh/100km" : f.fuel === "hydrogen" ? "kg/100km" : "l/100km", cycle: "WLTP" } : undefined,
      ev: f.fuel === "electric" && num(f.battery) ? { batteryNetKwh: num(f.battery) } : undefined,
      notes: ["Vom Nutzer angelegtes Fahrzeug. Alle Werte sind Eigenangaben und nicht geprüft."],
    };
    const r = vehicleSchema.safeParse(JSON.parse(JSON.stringify(candidate)));
    if (!r.success) {
      const i = r.error.issues[0];
      const names: Record<string, string> = { brand: "Marke", model: "Modell", "power.ps": "Leistung", "power.kw": "Leistung", "torque.nm": "Drehmoment", weightKg: "Leergewicht", yearFrom: "Baujahr", "engine.displacementCc": "Hubraum", "performance.vmax": "Höchstgeschwindigkeit", "performance.acc0100": "0–100 km/h", "gearbox.gears": "Gänge" };
      setError(`${names[i.path.join(".")] ?? i.path.join(".")}: Bitte einen plausiblen Wert eingeben.`);
      return;
    }
    setError(null);
    onSave(r.data as Vehicle);
  };

  const sel = `${inputCls} appearance-none`;
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Notice>Pflicht sind Marke, Modell, Leistung, Drehmoment und Leergewicht. Alles Weitere verbessert die Simulation; fehlende Werte ersetzt die Engine durch gekennzeichnete Annahmen.</Notice>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Marke"><input className={inputCls} value={f.brand} onChange={(e) => set("brand", e.target.value)} required /></Field>
        <Field label="Modell"><input className={inputCls} value={f.model} onChange={(e) => set("model", e.target.value)} required /></Field>
        <Field label="Generation"><input className={inputCls} value={f.generation} onChange={(e) => set("generation", e.target.value)} placeholder="optional" /></Field>
        <Field label="Motorisierung"><input className={inputCls} value={f.variant} onChange={(e) => set("variant", e.target.value)} placeholder="z. B. 1.3 TCe 150" /></Field>
        <Field label="Baujahr"><input className={inputCls} inputMode="numeric" value={f.year} onChange={(e) => set("year", e.target.value)} /></Field>
        <Field label="Karosserie">
          <select className={sel} value={f.body} onChange={(e) => set("body", e.target.value as Body)}>
            {[["hatch", "Schrägheck"], ["sedan", "Limousine"], ["wagon", "Kombi"], ["coupe", "Coupé"], ["roadster", "Roadster"], ["suv", "SUV"], ["supercar", "Supersportwagen"], ["pickup", "Pick-up"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Kraftstoff">
          <select className={sel} value={f.fuel} onChange={(e) => set("fuel", e.target.value as Fuel)}>
            <option value="petrol">Benzin</option><option value="diesel">Diesel</option><option value="electric">Elektro</option><option value="hydrogen">Wasserstoff</option>
          </select>
        </Field>
        {!electric && (
          <>
            <Field label="Hybridisierung">
              <select className={sel} value={f.hybrid} onChange={(e) => set("hybrid", e.target.value as Hybrid)}>
                <option value="none">keine</option><option value="mhev">Mildhybrid</option><option value="hev">Vollhybrid</option><option value="phev">Plug-in-Hybrid</option>
              </select>
            </Field>
            <Field label="Aufladung">
              <select className={sel} value={f.induction} onChange={(e) => set("induction", e.target.value as Induction)}>
                <option value="turbo">Turbo</option><option value="twin-turbo">Biturbo</option><option value="supercharger">Kompressor</option><option value="na">Saugmotor</option>
              </select>
            </Field>
            <Field label="Hubraum (cm³)"><input className={inputCls} inputMode="numeric" value={f.cc} onChange={(e) => set("cc", e.target.value)} placeholder="1998" /></Field>
            <Field label="Zylinder"><input className={inputCls} inputMode="numeric" value={f.cyl} onChange={(e) => set("cyl", e.target.value)} /></Field>
          </>
        )}
        <Field label="Leistung (PS)"><input className={inputCls} inputMode="decimal" value={f.ps} onChange={(e) => set("ps", e.target.value)} required /></Field>
        <Field label="Drehmoment (Nm)"><input className={inputCls} inputMode="decimal" value={f.nm} onChange={(e) => set("nm", e.target.value)} required /></Field>
        <Field label="Leergewicht (kg)"><input className={inputCls} inputMode="decimal" value={f.weight} onChange={(e) => set("weight", e.target.value)} required /></Field>
        <Field label="Antrieb">
          <select className={sel} value={f.drive} onChange={(e) => set("drive", e.target.value as Drive)}>
            <option value="FWD">Vorderradantrieb</option><option value="RWD">Hinterradantrieb</option><option value="AWD">Allradantrieb</option>
          </select>
        </Field>
        {!electric && (
          <>
            <Field label="Getriebe">
              <select className={sel} value={f.gearbox} onChange={(e) => set("gearbox", e.target.value as GearboxType)}>
                <option value="manual">Schaltgetriebe</option><option value="automatic">Wandlerautomatik</option><option value="dct">Doppelkupplung</option><option value="cvt">Stufenlos</option>
              </select>
            </Field>
            {f.gearbox !== "cvt" && <Field label="Gänge"><input className={inputCls} inputMode="numeric" value={f.gears} onChange={(e) => set("gears", e.target.value)} /></Field>}
          </>
        )}
        <Field label="Höchstgeschwindigkeit (km/h)" hint="optional"><input className={inputCls} inputMode="decimal" value={f.vmax} onChange={(e) => set("vmax", e.target.value)} /></Field>
        <Field label="0–100 km/h (s)" hint="optional, kalibriert das Modell"><input className={inputCls} inputMode="decimal" value={f.acc} onChange={(e) => set("acc", e.target.value)} /></Field>
        <Field label={f.fuel === "electric" ? "Verbrauch (kWh/100 km)" : "Verbrauch (l/100 km)"} hint="optional"><input className={inputCls} inputMode="decimal" value={f.cons} onChange={(e) => set("cons", e.target.value)} /></Field>
        {f.fuel === "electric" && <Field label="Nutzbare Batterie (kWh)" hint="optional"><input className={inputCls} inputMode="decimal" value={f.battery} onChange={(e) => set("battery", e.target.value)} /></Field>}
      </div>
      {f.vmax && (
        <label className="flex items-center gap-2.5 text-sm text-fg-2">
          <input type="checkbox" className="size-4 accent-[#2f8cff]" checked={f.limited} onChange={(e) => set("limited", e.target.checked)} />
          Höchstgeschwindigkeit ist elektronisch begrenzt
        </label>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <Button variant="primary" type="submit">Fahrzeug anlegen und simulieren</Button>
    </form>
  );
}
