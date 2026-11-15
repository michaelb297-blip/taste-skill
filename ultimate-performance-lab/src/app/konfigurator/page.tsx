"use client";

import clsx from "clsx";
import { BookmarkPlus, Check, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NoVehicle, PageSkeleton } from "@/components/no-vehicle";
import { CostTable, Flags, IssueList, LegalBlock, LoadPanel, MetricValue, VehicleBar } from "@/components/result-parts";
import { Button, Card, Chip, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { euroRange, nf, signed } from "@/lib/client/format";
import { useApp, vehicleTitle } from "@/lib/client/store";
import { useSim } from "@/lib/client/use-sim";
import { costScale, evaluateConfig, slotsFor, stageConfig, type Config, type Slot } from "@/lib/engine/components";
import { simulateConfig, type StageResult } from "@/lib/engine/simulate";
import { STAGE_LABEL, STAGE_ORDER, type StageId } from "@/lib/types";

export default function ConfiguratorPage() {
  const { ready, sim } = useSim();
  const { addGarage } = useApp();
  const [cfg, setCfg] = useState<Config>({});
  const [result, setResult] = useState<StageResult | null>(null);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const vid = sim?.vehicle.id;

  useEffect(() => {
    // gespeicherte Konfiguration aus der Garage übernehmen, sonst Serie
    let initial: Config = {};
    try {
      const raw = sessionStorage.getItem("upl.loadConfig");
      if (raw) {
        const p = JSON.parse(raw) as { vehicleId: string; config: Config };
        if (p.vehicleId === vid) initial = p.config;
        sessionStorage.removeItem("upl.loadConfig");
      }
    } catch {}
    setCfg(initial);
    setResult(null);
    setSaved(false);
  }, [vid]);

  const live = useMemo(() => (sim ? evaluateConfig(sim.vehicle, sim.model, cfg) : null), [sim, cfg]);
  if (!ready) return <PageSkeleton />;
  if (!sim || !live) return <NoVehicle what="Wähle ein Fahrzeug, um einzelne Komponenten zu kombinieren und als Gesamtsystem zu simulieren." />;
  const v = sim.vehicle;
  const slots = slotsFor(v, sim.model);
  const scale = costScale(v);
  const errors = live.issues.filter((i) => i.level === "error");
  const stock = sim.stages.stock;

  const pick = (slot: Slot, id: string) => {
    setCfg((c) => {
      const next = { ...c };
      if (id === "stock") delete next[slot];
      else next[slot] = id;
      return next;
    });
    setResult(null);
    setSaved(false);
  };
  const run = () => {
    setResult(simulateConfig(v, cfg));
    setSaved(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const preset = (s: StageId) => {
    setCfg(stageConfig(v, sim.model, s));
    setResult(null);
    setSaved(false);
  };
  const sameAs = (s: StageId) => JSON.stringify(Object.entries(stageConfig(v, sim.model, s)).sort()) === JSON.stringify(Object.entries(cfg).sort());

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader eyebrow="Tuning-Konfigurator" title="Eigene Konfiguration">
        Komponenten einzeln wählen. Die Engine prüft, ob sie zusammenpassen, und bewertet sie als Gesamtsystem: Die schwächste Baugruppe bestimmt die Leistung – Einzelversprechen werden nicht addiert.
      </PageHeader>
      <VehicleBar />

      <div className="scroll-x -mx-4 mb-5 flex items-center gap-2 px-4 md:mx-0 md:px-0">
        <span className="shrink-0 text-xs text-muted">Vorlage:</span>
        {STAGE_ORDER.map((s) => (
          <Chip key={s} active={sameAs(s)} onClick={() => preset(s)}>{STAGE_LABEL[s]}</Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4">
          {slots.map((s) => (
            <fieldset key={s.slot} className="card p-4 md:p-5">
              <legend className="float-left mb-3 w-full text-sm font-semibold">{s.label}</legend>
              <div className="clear-both grid gap-2">
                {s.options.map((opt) => {
                  const active = (cfg[s.slot] ?? "stock") === opt.id;
                  const sc = s.slot === "software" ? Math.min(scale, 1.8) : s.slot === "chassis" ? 1 : scale;
                  const cost: [number, number] = [Math.round(((opt.material[0] + (opt.tuning?.[0] ?? 0)) * sc) / 10) * 10, Math.round(((opt.material[1] + (opt.tuning?.[1] ?? 0)) * sc) / 10) * 10];
                  const products = sim.model.products[s.slot];
                  return (
                    <label key={opt.id} className={clsx("flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors", active ? "border-accent bg-accent/[0.07]" : "border-line-soft bg-panel hover:border-line")}>
                      <input type="radio" name={s.slot} className="sr-only" checked={active} onChange={() => pick(s.slot, opt.id)} />
                      <span className={clsx("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", active ? "border-accent" : "border-line")}>{active && <span className="size-2 rounded-full bg-accent" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm font-medium">{opt.name}</span>
                          {opt.id !== "stock" && <span className="num text-xs text-fg-2">{euroRange(cost)}</span>}
                        </span>
                        {opt.id !== "stock" && (
                          <>
                            <span className="mt-1 block text-[0.8125rem] leading-relaxed text-fg-2">{opt.description}</span>
                            <span className="mt-1 block text-[0.8125rem] leading-relaxed text-fg-2"><span className="text-muted">Einfluss:</span> {opt.effect}</span>
                            <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem] text-muted">
                              <span>Kompatibilität: {sim.model.familyName}</span>
                              <span>Einbauaufwand: {opt.effort}{opt.laborH ? ` (ca. ${nf(opt.laborH * Math.sqrt(scale), 1)} h)` : ""}</span>
                              <span className={opt.legal === "track" ? "text-bad" : opt.legal === "eintragung" ? "text-warn" : ""}>{opt.legal === "track" ? "praktisch nicht zulassungsfähig" : opt.legal === "eintragung" ? "eintragungspflichtig" : "zulassungsneutral"}</span>
                              <span>Preis: Richtwert der Komponentenklasse</span>
                            </span>
                            {active && opt.legalNote && <span className="mt-1.5 block text-[0.6875rem] leading-relaxed text-warn">{opt.legalNote}</span>}
                            {active && products?.length ? (
                              <span className="mt-1.5 block text-[0.6875rem] text-muted">
                                Recherchierte Produkte:{" "}
                                {products.map((p, i) => (
                                  <span key={p.url}>{i > 0 && ", "}<a href={p.url} target="_blank" rel="noopener noreferrer" className="text-fg-2 underline underline-offset-2 hover:text-accent">{p.name} ({p.maker})</a></span>
                                ))}
                              </span>
                            ) : null}
                          </>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6">
          <Card className="p-4 md:p-5">
            <p className="eyebrow">Systemprüfung (live)</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted">Leistung</p><p><span className="num text-2xl font-semibold">{nf(live.ps)}</span> <span className="text-xs text-muted">PS</span></p></div>
              <div><p className="text-xs text-muted">Drehmoment</p><p><span className="num text-2xl font-semibold">{nf(live.nm)}</span> <span className="text-xs text-muted">Nm</span></p></div>
            </div>
            <p className="mt-2 text-xs text-fg-2">{live.limitedBy.length ? `Engpass: ${live.limitedBy.join(" · ")}` : live.ps === v.power.ps ? "Serienleistung" : "Kein Engpass in dieser Ausbaustufe"}</p>
            <p className="mt-1 text-xs text-muted">Kosten (Richtwert): <span className="num text-fg-2">{euroRange(live.costs.total)}</span></p>
            <div className="mt-3"><Flags e={live} /></div>
            <Button variant="primary" size="lg" className="mt-4 hidden w-full lg:inline-flex" onClick={run} disabled={errors.length > 0}>
              <Play className="size-4" />MEINE KONFIGURATION SIMULIEREN
            </Button>
            {errors.length > 0 && <p className="mt-2 text-xs text-bad">Erst die markierten Konflikte beheben.</p>}
          </Card>
          <IssueList issues={live.issues} />
          {live.issues.length === 0 && <Notice tone="ok">Keine Konflikte: Die gewählten Komponenten passen zusammen.</Notice>}
        </aside>
      </div>

      {/* feste Aktionsleiste auf dem Smartphone */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line-soft bg-panel/95 p-3 backdrop-blur-xl lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <Button variant="primary" size="lg" className="w-full" onClick={run} disabled={errors.length > 0}>
          <Play className="size-4" />MEINE KONFIGURATION SIMULIEREN
        </Button>
      </div>

      <div ref={resultRef} className="scroll-mt-20">
        {result && (
          <section className="mt-8 space-y-4">
            <SectionTitle hint="simuliert, keine Messung">Ergebnis deiner Konfiguration</SectionTitle>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Leistung", <span key="a"><span className="num text-2xl font-semibold md:text-3xl">{nf(result.ps)}</span><span className="ml-1 text-xs text-muted">PS</span><span className="num block text-[0.6875rem] text-muted">{nf(result.psRange[0])}–{nf(result.psRange[1])}</span></span>, `${signed(result.gainPct, 1)} %`],
                  ["Drehmoment", <span key="b"><span className="num text-2xl font-semibold md:text-3xl">{nf(result.nm)}</span><span className="ml-1 text-xs text-muted">Nm</span></span>, `${signed(result.nmGainPct, 1)} %`],
                  ["0–100 km/h", <MetricValue key="c" m={result.acc0100} unit="s" big />, stock.acc0100.value != null && result.acc0100.value != null ? `${signed(result.acc0100.value - stock.acc0100.value, 1)} s` : ""],
                  ["100–200 km/h", <MetricValue key="d" m={result.acc100200} unit="s" big />, stock.acc100200.value != null && result.acc100200.value != null ? `${signed(result.acc100200.value - stock.acc100200.value, 1)} s` : ""],
                  ["Vmax ohne Begrenzer", <MetricValue key="e" m={result.vmaxUnlimited} unit="km/h" digits={0} big />, stock.vmaxUnlimited.value != null && result.vmaxUnlimited.value != null ? `${signed(result.vmaxUnlimited.value - stock.vmaxUnlimited.value)} km/h` : ""],
                  ["Verbrauch", <MetricValue key="f" m={result.consumption} unit={result.consumptionUnit.replace("/100km", "")} big />, result.consumption?.value != null && stock.consumption?.value != null ? `${signed(result.consumption.value - stock.consumption.value, 1)}` : "nicht hinterlegt"],
                ].map(([label, node, delta]) => (
                  <div key={label as string} className="bg-surface px-4 py-4">
                    <p className="text-xs text-muted">{label}</p>
                    <div className="mt-1.5">{node}</div>
                    <p className="num mt-1 text-xs text-accent">{delta} <span className="text-muted">zur Serie</span></p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LoadPanel r={result} model={sim.model} />
              <CostTable costs={result.evaluation.costs} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={saved}
                onClick={async () => {
                  await addGarage({ kind: "konfiguration", title: `${vehicleTitle(v)} · eigene Konfiguration (${result.ps} PS)`, payload: { vehicleId: v.id, ...(v.custom ? { vehicle: v } : {}), config: cfg, ps: result.ps, nm: result.nm, acc0100: result.acc0100.value, costs: result.evaluation.costs.total } });
                  setSaved(true);
                }}
              >
                {saved ? <Check className="size-4 text-ok" /> : <BookmarkPlus className="size-4" />}
                {saved ? "In der Garage gespeichert" : "Konfiguration speichern"}
              </Button>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8"><LegalBlock /></div>
    </div>
  );
}
