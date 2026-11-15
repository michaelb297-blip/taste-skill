"use client";

import type { Vehicle } from "@/lib/types";
import { nf } from "@/lib/client/format";
import { Card } from "./ui";

const FUEL = { petrol: "Benzin", diesel: "Diesel", electric: "Strom", hydrogen: "Wasserstoff" };
const HYBRID = { none: "–", mhev: "Mildhybrid", hev: "Vollhybrid", phev: "Plug-in-Hybrid" };
const IND = { na: "Saugmotor", turbo: "Turbolader", "twin-turbo": "Zwei Turbolader", supercharger: "Kompressor", electric: "–" };
const LAYOUT = { R: "Reihe", V: "V", B: "Boxer", W: "W" };
const GB = { manual: "Schaltgetriebe", automatic: "Wandlerautomatik", dct: "Doppelkupplungsgetriebe", cvt: "Stufenloses Getriebe", "single-speed": "Feste Übersetzung" };
const DRIVE = { AWD: "Allradantrieb", RWD: "Hinterradantrieb", FWD: "Vorderradantrieb" };

type Row = [string, string | null | undefined];

function rows(v: Vehicle): { title: string; rows: Row[] }[] {
  const e = v.engine;
  const rpm = (a?: number, b?: number) => (a == null ? null : b != null && b !== a ? `${nf(a)}–${nf(b)} /min` : `${nf(a)} /min`);
  const electric = e.fuel === "electric" || e.fuel === "hydrogen";
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Fahrzeug",
      rows: [
        ["Hersteller", v.brand], ["Modell", v.model], ["Generation", v.generation || null],
        ["Bauzeit", v.yearTo ? `${v.yearFrom}–${v.yearTo}` : `seit ${v.yearFrom}`], ["Markt", v.market],
        ["Leergewicht", `${nf(v.weightKg)} kg${v.weightBasis ? ` (${v.weightBasis})` : ""}`],
        ["Leistungsgewicht", `${nf(v.power.ps / (v.weightKg / 1000))} PS/t · ${nf(v.weightKg / v.power.ps, 1)} kg/PS`],
      ],
    },
    {
      title: electric ? "Antrieb" : "Motor",
      rows: electric
        ? [["Bauart", e.name], ["Energieträger", FUEL[e.fuel]], ["Motoren", v.ev?.motors ? `${v.ev.motors.length} (${v.ev.motors.map((m) => `${m.position === "front" ? "vorn" : "hinten"}${m.kw ? ` ${m.kw} kW` : ""}`).join(", ")})` : null], ["Systemspannung", v.ev?.voltage ? `${v.ev.voltage} V` : null], ["Batterie brutto", v.ev?.batteryGrossKwh ? `${nf(v.ev.batteryGrossKwh, 1)} kWh` : null], ["Batterie nutzbar", v.ev?.batteryNetKwh ? `${nf(v.ev.batteryNetKwh, 1)} kWh` : null]]
        : [
            ["Motorbezeichnung", e.name], ["Motorcode", e.code], ["Hubraum", e.displacementCc ? `${nf(e.displacementCc)} cm³` : null],
            ["Zylinder", e.cylinders ? `${e.cylinders}${e.layout ? ` · ${LAYOUT[e.layout]}` : ""}` : null], ["Verdichtung", e.compression ? `${nf(e.compression, 1)} : 1` : null],
            ["Aufladung", IND[e.induction]], ["Turbolader", e.turbos != null ? String(e.turbos) : null], ["Serien-Ladedruck", e.boostBar ? `${nf(e.boostBar, 1)} bar` : null],
            ["Kraftstoff", FUEL[e.fuel]], ["Hybridisierung", e.hybrid === "none" ? undefined : HYBRID[e.hybrid]], ["Hybridbatterie", v.ev?.batteryGrossKwh ? `${nf(v.ev.batteryGrossKwh, 1)} kWh` : undefined],
            ["Motorsteuergerät", e.ecu], ["Kühlung", e.cooling], ["Höchstdrehzahl", e.redline ? `${nf(e.redline)} /min` : null],
          ],
    },
    {
      title: "Leistung",
      rows: [
        ["Leistung", `${nf(v.power.ps)} PS · ${nf(v.power.kw)} kW · ${nf(v.power.kw * 1.34102)} hp`], ["bei Drehzahl", rpm(v.power.rpmFrom, v.power.rpmTo)],
        ["Drehmoment", `${nf(v.torque.nm)} Nm`], ["bei Drehzahl", electric ? undefined : rpm(v.torque.rpmFrom, v.torque.rpmTo)],
        ["Höchstgeschwindigkeit", v.performance.vmax ? `${nf(v.performance.vmax)} km/h${v.performance.vmaxLimited ? " (begrenzt)" : ""}` : null],
        ["0–100 km/h", v.performance.acc0100 ? `${nf(v.performance.acc0100, 1)} s` : null], ["100–200 km/h", v.performance.acc100200 ? `${nf(v.performance.acc100200, 1)} s` : null],
      ],
    },
    {
      title: "Kraftübertragung",
      rows: [
        ["Getriebe", `${v.gearbox.type !== "single-speed" && v.gearbox.type !== "cvt" ? `${v.gearbox.gears}-Gang ` : ""}${GB[v.gearbox.type]}`], ["Bezeichnung", v.gearbox.name],
        ["Getriebesteuergerät", electric ? undefined : v.gearbox.tcu], ["Übersetzungen", v.gearbox.ratios ? v.gearbox.ratios.map((r) => nf(r, 3)).join(" · ") : electric ? undefined : null],
        ["Achsübersetzung", v.gearbox.finalDrive ? nf(v.gearbox.finalDrive, 3) : electric ? undefined : null], ["Antrieb", DRIVE[v.drive]],
        ["Reifen", v.tyres ? `${v.tyres.front}${v.tyres.rear ? ` / ${v.tyres.rear}` : ""}` : null], ["Bremsanlage", v.brakes ?? null],
      ],
    },
    {
      title: "Verbrauch und Emissionen",
      rows: [
        ["Verbrauch", v.consumption ? `${nf(v.consumption.value, 1)} ${v.consumption.unit.replace("100km", "100 km")} (${v.consumption.cycle})` : null],
        ["CO₂", v.co2 != null ? `${v.co2} g/km` : electric ? "0 g/km (lokal)" : null], ["Abgasnorm", electric ? undefined : (v.emission ?? null)],
        [electric ? undefined! : "Tankvolumen", electric ? undefined : v.tankL ? `${v.tankL} l` : null],
      ],
    },
  ];
  return groups.map((g) => ({ ...g, rows: g.rows.filter((r) => r[0] && r[1] !== undefined) }));
}

/** Technisches Datenblatt. Fehlende Werte bleiben sichtbar leer – nichts wird ergänzt. */
export function SpecTable({ vehicle }: { vehicle: Vehicle }) {
  const groups = rows(vehicle);
  const missing = groups.flatMap((g) => g.rows).filter((r) => r[1] == null).length;
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.title} className="overflow-hidden">
            <p className="eyebrow border-b border-line-soft px-4 py-3">{g.title}</p>
            <dl className="divide-y divide-line-soft">
              {g.rows.map(([k, val], i) => (
                <div key={`${k}-${i}`} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                  <dt className="shrink-0 text-[0.8125rem] text-muted">{k}</dt>
                  <dd className={`min-w-0 text-right text-[0.8125rem] ${val == null ? "text-muted/70" : "text-fg"}`}>{val ?? "nicht hinterlegt"}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {vehicle.custom
          ? "Alle Werte sind Eigenangaben des Nutzers."
          : vehicle.sources?.length
            ? "Kernwerte dieses Datensatzes sind mit Quellen belegt (siehe Recherche und Quellen)."
            : "Herstellerangaben laut redaktionell gepflegtem Katalog; für diesen Datensatz liegt keine Live-Gegenprüfung vor."}{" "}
        {missing > 0 && `${missing} Felder sind nicht hinterlegt und werden nicht geschätzt.`}
      </p>
    </div>
  );
}
