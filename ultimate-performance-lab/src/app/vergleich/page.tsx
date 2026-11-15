"use client";

import { BookmarkPlus, Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DynoChart, type DynoSeries } from "@/components/dyno-chart";
import { PageSkeleton } from "@/components/no-vehicle";
import { MetricValue } from "@/components/result-parts";
import { Button, Card, inputCls, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { VehicleSearch } from "@/components/vehicle-search";
import { euroRange, nf } from "@/lib/client/format";
import { useApp, vehicleTitle } from "@/lib/client/store";
import { simulateVehicle, type Simulation, type StageResult } from "@/lib/engine/simulate";
import { STAGE_LABEL, STAGE_ORDER, type StageId, type Vehicle } from "@/lib/types";

interface Entry {
  key: string;
  vehicle: Vehicle;
  stage: StageId;
}
const COLORS = ["#2f8cff", "#ff6a2b", "#34d0a2", "#c084fc"];
const DRIVE = { AWD: "Allrad", RWD: "Hinterrad", FWD: "Vorderrad" };
const MAX = 4;

export default function ComparePage() {
  const { vehicle, ready, customVehicles, addGarage } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [booted, setBooted] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async (id: string): Promise<Vehicle | null> => {
    const c = customVehicles.find((x) => x.id === id);
    if (c) return c;
    const res = await fetch(`/api/vehicles/${encodeURIComponent(id)}`);
    return res.ok ? ((await res.json()) as Vehicle) : null;
  };

  useEffect(() => {
    if (!ready || booted) return;
    setBooted(true);
    const p = new URLSearchParams(window.location.search);
    const ids = (p.get("ids") ?? "").split(",").filter(Boolean).slice(0, MAX);
    const stages = (p.get("stages") ?? "").split(",");
    const stage = p.get("stage");
    (async () => {
      if (ids.length) {
        const vs = (await Promise.all(ids.map((id) => load(id)))).filter(Boolean) as Vehicle[];
        if (stage === "alle" && vs.length === 1) setEntries((["stock", "stage1", "stage2", "stage3s"] as StageId[]).map((s) => ({ key: crypto.randomUUID(), vehicle: vs[0], stage: s })));
        else setEntries(vs.map((v, i) => ({ key: crypto.randomUUID(), vehicle: v, stage: (STAGE_ORDER.includes(stages[i] as StageId) ? stages[i] : STAGE_ORDER.includes(stage as StageId) ? stage : "stage1") as StageId })));
      } else if (vehicle) setEntries([{ key: crypto.randomUUID(), vehicle, stage: "stock" }, { key: crypto.randomUUID(), vehicle, stage: "stage1" }]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const sims = useMemo(() => {
    const cache = new Map<string, Simulation>();
    return entries.map((e) => {
      if (!cache.has(e.vehicle.id)) cache.set(e.vehicle.id, simulateVehicle(e.vehicle));
      const sim = cache.get(e.vehicle.id)!;
      return { e, sim, r: sim.stages[e.stage] };
    });
  }, [entries]);

  if (!ready) return <PageSkeleton />;
  const add = async (id: string) => {
    const v = await load(id);
    if (v) setEntries((es) => (es.length >= MAX ? es : [...es, { key: crypto.randomUUID(), vehicle: v, stage: "stage1" }]));
    setSaved(false);
  };
  const name = (x: { e: Entry; r: StageResult }) => `${vehicleTitle(x.e.vehicle)} · ${x.r.label}`;

  type Row = { label: string; cell: (x: (typeof sims)[number]) => React.ReactNode };
  const rows: Row[] = [
    { label: "Serienleistung", cell: (x) => <span className="num">{nf(x.e.vehicle.power.ps)} PS</span> },
    { label: "Leistung in der Stufe", cell: (x) => <span className="num text-base font-semibold">{nf(x.r.ps)} PS</span> },
    { label: "Drehmoment", cell: (x) => <span className="num">{nf(x.r.nm)} Nm</span> },
    { label: "0–100 km/h", cell: (x) => <MetricValue m={x.r.acc0100} unit="s" /> },
    { label: "100–200 km/h", cell: (x) => <MetricValue m={x.r.acc100200} unit="s" /> },
    { label: "Höchstgeschwindigkeit", cell: (x) => <MetricValue m={x.r.vmax} unit="km/h" digits={0} /> },
    { label: "… ohne Begrenzer", cell: (x) => <MetricValue m={x.r.vmaxUnlimited} unit="km/h" digits={0} /> },
    { label: "Leergewicht", cell: (x) => <span className="num">{nf(x.e.vehicle.weightKg)} kg</span> },
    { label: "Leistungsgewicht", cell: (x) => <span className="num">{nf(x.r.psPerTon)} PS/t</span> },
    { label: "Verbrauch", cell: (x) => (x.r.consumption ? <MetricValue m={x.r.consumption} unit={x.r.consumptionUnit.replace("/100km", "")} /> : <span className="text-muted">nicht hinterlegt</span>) },
    { label: "Tuningkosten (Richtwert)", cell: (x) => <span className="num text-xs">{euroRange(x.r.evaluation.costs.total)}</span> },
    { label: "Motor", cell: (x) => <span className="text-xs text-fg-2">{x.e.vehicle.engine.name}</span> },
    { label: "Antrieb und Getriebe", cell: (x) => <span className="text-xs text-fg-2">{DRIVE[x.e.vehicle.drive]} · {x.e.vehicle.gearbox.name ?? `${x.e.vehicle.gearbox.gears} Gänge`}</span> },
    { label: "Technische Besonderheit", cell: (x) => <span className="text-xs leading-snug text-fg-2">{x.r.evaluation.limitedBy.length ? `Begrenzt durch ${x.r.evaluation.limitedBy.join(", ")}` : (x.sim.model.weaknesses[0] ?? x.sim.model.notes[0] ?? "–")}</span> },
    { label: "Zulassung", cell: (x) => <span className={`text-xs ${x.r.evaluation.flags.trackOnly ? "text-bad" : x.r.evaluation.flags.needsApproval ? "text-warn" : "text-fg-2"}`}>{x.r.evaluation.flags.trackOnly ? "nicht straßenzulässig" : x.r.evaluation.flags.needsApproval ? "eintragungspflichtig" : "Serie"}</span> },
  ];

  const bars: { label: string; unit: string; digits: number; lowerBetter?: boolean; get: (r: StageResult) => number | null }[] = [
    { label: "Leistung", unit: "PS", digits: 0, get: (r) => r.ps },
    { label: "Drehmoment", unit: "Nm", digits: 0, get: (r) => r.nm },
    { label: "0–100 km/h", unit: "s", digits: 1, lowerBetter: true, get: (r) => r.acc0100.value },
    { label: "100–200 km/h", unit: "s", digits: 1, lowerBetter: true, get: (r) => r.acc100200.value },
    { label: "Leistungsgewicht", unit: "PS/t", digits: 0, get: (r) => r.psPerTon },
    { label: "Höchstgeschwindigkeit ohne Begrenzer", unit: "km/h", digits: 0, get: (r) => r.vmaxUnlimited.value },
  ];
  const series: DynoSeries[] = sims.map((x, i) => ({ key: x.e.key.slice(0, 8), label: name(x), color: COLORS[i], result: x.r }));
  const mixedAxis = new Set(sims.map((x) => x.e.vehicle.engine.fuel === "electric")).size > 1;

  return (
    <div>
      <PageHeader eyebrow="Fahrzeugvergleich" title="Bis zu vier Konfigurationen">
        Verschiedene Fahrzeuge gegeneinander – oder dasselbe Fahrzeug in mehreren Stufen. Jede Spalte hat ihre eigene Tuning-Stufe.
      </PageHeader>

      {entries.length < MAX && (
        <div className="mb-5">
          <VehicleSearch onPick={(id) => void add(id)} placeholder="Fahrzeug zum Vergleich hinzufügen" />
        </div>
      )}

      {sims.length === 0 ? (
        <Card className="px-5 py-10 text-center text-sm text-fg-2">Füge oben zwei bis vier Fahrzeuge hinzu, um sie zu vergleichen.</Card>
      ) : (
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <div className="scroll-x">
              <table className="w-full border-collapse text-[0.8125rem]" style={{ minWidth: 200 + sims.length * 190 }}>
                <thead>
                  <tr className="border-b border-line-soft align-top">
                    <th className="sticky left-0 z-10 w-40 bg-surface px-4 py-3 text-left text-[0.6875rem] font-medium uppercase tracking-wider text-muted">Kennzahl</th>
                    {sims.map((x, i) => (
                      <th key={x.e.key} className="px-3 py-3 text-left font-normal">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i] }} />
                            <span className="truncate text-sm font-semibold">{vehicleTitle(x.e.vehicle)}</span>
                          </span>
                          <button type="button" aria-label={`${vehicleTitle(x.e.vehicle)} entfernen`} onClick={() => setEntries((es) => es.filter((y) => y.key !== x.e.key))} className="text-muted hover:text-bad">
                            <X className="size-4" />
                          </button>
                        </div>
                        <select aria-label="Tuning-Stufe" className={`${inputCls} mt-2 h-9 text-xs`} value={x.e.stage} onChange={(ev) => { setSaved(false); setEntries((es) => es.map((y) => (y.key === x.e.key ? { ...y, stage: ev.target.value as StageId } : y))); }}>
                          {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left font-normal text-fg-2">{row.label}</th>
                      {sims.map((x) => <td key={x.e.key} className="px-3 py-2.5 align-top">{row.cell(x)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <section>
            <SectionTitle hint="Balken relativ zum besten Wert">Performance-Vergleich</SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {bars.map((b) => {
                const vals = sims.map((x) => b.get(x.r));
                const nums = vals.filter((n): n is number => n != null);
                if (!nums.length) return null;
                const best = b.lowerBetter ? Math.min(...nums) : Math.max(...nums);
                const max = Math.max(...nums);
                return (
                  <Card key={b.label} className="p-4 md:p-5">
                    <p className="mb-3 text-sm font-medium">{b.label} {b.lowerBetter && <span className="text-xs font-normal text-muted">· kürzer ist besser</span>}</p>
                    <div className="space-y-2.5">
                      {sims.map((x, i) => {
                        const val = vals[i];
                        return (
                          <div key={x.e.key}>
                            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                              <span className="truncate text-fg-2">{name(x)}</span>
                              <span className="num shrink-0 text-fg">{val == null ? "–" : `${nf(val, b.digits)} ${b.unit}`}{val === best && sims.length > 1 && <span className="ml-1.5 text-ok">●</span>}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-raised">
                              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: val == null ? 0 : `${(val / max) * 100}%`, background: COLORS[i] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle hint="Leistung durchgezogen, Drehmoment gestrichelt">Kennlinien</SectionTitle>
            <Card className="p-4 md:p-5">
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
                {series.map((s) => (
                  <span key={s.key} className="flex items-center gap-2 text-xs text-fg-2"><span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />{s.label}</span>
                ))}
              </div>
              <DynoChart series={series} height={340} />
              {mixedAxis && <p className="mt-2 text-xs text-muted">Elektroantriebe sind über der (angenommenen) Maschinendrehzahl aufgetragen und deshalb nur in der Höhe, nicht im Verlauf vergleichbar.</p>}
            </Card>
          </section>

          <Notice tone="warn">Stufenwerte sind simuliert bzw. recherchiert, Serienwerte Herstellerangaben. Unterschiedlich gut belegte Motormodelle sind nur eingeschränkt vergleichbar.</Notice>

          <Button
            disabled={saved || sims.length < 2}
            onClick={async () => {
              await addGarage({ kind: "vergleich", title: sims.map(name).join(" vs. ").slice(0, 150), payload: { entries: sims.map((x) => ({ vehicleId: x.e.vehicle.id, stage: x.e.stage, title: vehicleTitle(x.e.vehicle), ps: x.r.ps, acc0100: x.r.acc0100.value })) } });
              setSaved(true);
            }}
          >
            {saved ? <Check className="size-4 text-ok" /> : <BookmarkPlus className="size-4" />}
            {saved ? "Vergleich gespeichert" : "Vergleich speichern"}
          </Button>
        </div>
      )}
    </div>
  );
}
