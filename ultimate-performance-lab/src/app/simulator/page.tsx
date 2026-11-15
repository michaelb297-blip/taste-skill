"use client";

import clsx from "clsx";
import { BookmarkPlus, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { NoVehicle, PageSkeleton } from "@/components/no-vehicle";
import { Assumptions, CostTable, Flags, HardwareList, IssueList, LegalBlock, LoadPanel, MetricValue, ProvLegend, SimNotice, VehicleBar } from "@/components/result-parts";
import { BasisBadge, Button, Card, Chip, LinkButton, Notice, PageHeader, ProvBadge, SectionTitle } from "@/components/ui";
import { euroRange, nf, signed } from "@/lib/client/format";
import { useApp, vehicleTitle } from "@/lib/client/store";
import { useSim } from "@/lib/client/use-sim";
import { PROFILES } from "@/lib/engine/profiles";
import { profileResults, type Metric, type StageResult } from "@/lib/engine/simulate";
import { PROFILE_ORDER, STAGE_COLOR, STAGE_ORDER, type ProfileId, type StageId } from "@/lib/types";

type Row = { label: string; cell: (r: StageResult) => React.ReactNode };
const plain = (v: string | number, unit?: string) => (
  <span>
    <span className="num text-sm font-medium">{v}</span>
    {unit && <span className="ml-0.5 text-[0.6875rem] text-muted">{unit}</span>}
  </span>
);
const m = (get: (r: StageResult) => Metric | null, unit: string, digits = 1) => (r: StageResult) => <MetricValue m={get(r)} unit={unit} digits={digits} />;

export default function SimulatorPage() {
  const { ready, sim } = useSim();
  const { addGarage, settings } = useApp();
  const [stage, setStage] = useState<StageId>("stage1");
  const [profile, setProfile] = useState<ProfileId>("daily");
  const [saved, setSaved] = useState<string | null>(null);
  const profiles = useMemo(() => (sim ? profileResults(sim.vehicle, sim.stages[stage]) : null), [sim, stage]);

  if (!ready) return <PageSkeleton />;
  if (!sim || !profiles) return <NoVehicle what="Wähle ein Fahrzeug – Serie, Stage 1, Stage 2 und beide Stage-3-Varianten werden sofort berechnet." />;
  const v = sim.vehicle;
  const r = sim.stages[stage];
  const pr = profiles[profile];
  const P = PROFILES[profile];
  const electric = v.engine.fuel === "electric";
  const kwFirst = settings.powerUnit === "kw";

  const rows: Row[] = [
    { label: kwFirst ? "Leistung kW" : "Leistung PS", cell: (x) => (
      <span>
        <span className="num text-base font-semibold">{nf(kwFirst ? x.kw : x.ps)}</span>
        {x.psRange[0] !== x.psRange[1] && <span className="num block text-[0.6875rem] leading-tight text-muted">{nf(kwFirst ? x.psRange[0] / 1.35962 : x.psRange[0])}–{nf(kwFirst ? x.psRange[1] / 1.35962 : x.psRange[1])}</span>}
      </span>
    ) },
    { label: kwFirst ? "Leistung PS" : "Leistung kW", cell: (x) => plain(nf(kwFirst ? x.ps : x.kw)) },
    { label: "Drehmoment Nm", cell: (x) => plain(nf(x.nm)) },
    { label: "Leistungszuwachs", cell: (x) => (x.stage === "stock" ? <span className="text-muted">–</span> : plain(signed(x.gainPct, 1), "%")) },
    { label: "Drehmomentzuwachs", cell: (x) => (x.stage === "stock" ? <span className="text-muted">–</span> : plain(signed(x.nmGainPct, 1), "%")) },
    { label: "0–100 km/h", cell: m((x) => x.acc0100, "s") },
    { label: "80–120 km/h", cell: m((x) => x.acc80120, "s") },
    { label: "100–200 km/h", cell: m((x) => x.acc100200, "s") },
    { label: "Höchstgeschwindigkeit", cell: m((x) => x.vmax, "km/h", 0) },
    { label: "… ohne Begrenzer", cell: m((x) => x.vmaxUnlimited, "km/h", 0) },
    { label: `Verbrauch ${sim.stages.stock.consumptionUnit.replace("100km", "100 km")}`, cell: m((x) => x.consumption, "", 1) },
    ...(electric ? [{ label: "Reichweite", cell: m((x) => x.rangeKm, "km", 0) }] : []),
    { label: "Leistungsgewicht", cell: (x) => plain(nf(x.psPerTon), "PS/t") },
    { label: "Radleistung (geschätzt)", cell: (x) => plain(nf(x.wheelPs), "PS") },
    { label: "Thermische Belastung", cell: (x) => plain(x.evaluation.loads.thermal, "%") },
    ...(sim.model.powerTuningAvailable ? [{ label: "Getriebebelastung", cell: (x: StageResult) => plain(x.evaluation.loads.gearbox, "%") }] : []),
    { label: "Kosten (Richtwert)", cell: (x) => <span className="num text-xs text-fg-2">{euroRange(x.evaluation.costs.total)}</span> },
  ];

  const save = async () => {
    await addGarage({
      kind: "simulation",
      title: `${vehicleTitle(v)} · ${r.label} · ${P.name}`,
      payload: { vehicleId: v.id, ...(v.custom ? { vehicle: v } : {}), stage, profile, ps: r.ps, nm: r.nm, acc0100: pr.acc0100, vmax: r.vmax.value, costs: r.evaluation.costs.total },
    });
    setSaved(`${stage}-${profile}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Performance Simulator" title="Serie und alle Tuning-Stufen" actions={<LinkButton href="/pruefstand" variant="primary">Auf den Prüfstand</LinkButton>}>
        Motorspezifisch berechnet mit dem Modell „{sim.model.familyName}“. Fahrleistungen stammen aus einer Längsdynamik-Simulation, kalibriert an den Herstellerangaben der Serie.
      </PageHeader>
      <VehicleBar />

      <div className="space-y-8">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <BasisBadge basis={sim.stages.stage1.basis} confidence={sim.model.confidence} />
            <ProvLegend />
          </div>
          <Card className="overflow-hidden">
            <div className="scroll-x">
              <table className="w-full min-w-[640px] border-collapse md:min-w-[760px]">
                <thead>
                  <tr className="border-b border-line-soft">
                    <th className="sticky left-0 z-10 w-32 bg-surface px-4 py-3 text-left md:w-44 text-[0.6875rem] font-medium uppercase tracking-wider text-muted">Kennzahl</th>
                    {STAGE_ORDER.map((id) => (
                      <th key={id} className={clsx("px-3 py-3 text-right align-bottom", id === stage && "bg-raised/70")}>
                        <button type="button" onClick={() => setStage(id)} className="inline-flex flex-col items-end gap-1.5">
                          <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                            <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[id] }} />
                            {sim.stages[id].label}
                          </span>
                          <ProvBadge prov={sim.stages[id].psProv} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left text-[0.8125rem] font-normal text-fg-2">{row.label}</th>
                      {STAGE_ORDER.map((id) => (
                        <td key={id} className={clsx("px-3 py-2.5 text-right align-top", id === stage && "bg-raised/70")}>{row.cell(sim.stages[id])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="mt-3"><SimNotice /></div>
        </section>

        <section>
          <SectionTitle hint="Stufe und Fahrprofil frei kombinierbar">Detailansicht</SectionTitle>
          <div className="scroll-x -mx-4 mb-3 flex gap-2 px-4 md:mx-0 md:px-0" role="group" aria-label="Tuning-Stufe">
            {STAGE_ORDER.map((id) => (
              <Chip key={id} active={id === stage} onClick={() => setStage(id)}>
                <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[id] }} />
                {sim.stages[id].label}
              </Chip>
            ))}
          </div>
          <div className="scroll-x -mx-4 mb-4 flex gap-2 px-4 md:mx-0 md:px-0" role="group" aria-label="Fahrprofil">
            {PROFILE_ORDER.map((id) => (
              <Chip key={id} active={id === profile} onClick={() => setProfile(id)}>{PROFILES[id].name}</Chip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Card className="relative overflow-hidden p-5 md:p-6">
              <div className="absolute -right-20 -top-24 size-64 rounded-full blur-[90px]" style={{ background: `${STAGE_COLOR[stage]}33` }} />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow">{r.label} · Profil {P.name}</p>
                  <Flags e={r.evaluation} />
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-2">{r.description}</p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  <div><dt className="text-xs text-muted">Leistung</dt><dd className="mt-1"><span className="num text-3xl font-semibold md:text-4xl">{nf(kwFirst ? r.kw : r.ps)}</span> <span className="text-xs text-muted">{kwFirst ? "kW" : "PS"}</span></dd></div>
                  <div><dt className="text-xs text-muted">Drehmoment</dt><dd className="mt-1"><span className="num text-3xl font-semibold md:text-4xl">{nf(r.nm)}</span> <span className="text-xs text-muted">Nm</span></dd></div>
                  <div><dt className="text-xs text-muted">0–100 km/h im Profil</dt><dd className="mt-1"><span className="num text-3xl font-semibold md:text-4xl">{nf(pr.acc0100, 1)}</span> <span className="text-xs text-muted">s</span></dd></div>
                  <div><dt className="text-xs text-muted">Höchstgeschwindigkeit</dt><dd className="mt-1"><span className="num text-3xl font-semibold md:text-4xl">{nf(r.vmax.value)}</span> <span className="text-xs text-muted">km/h</span></dd></div>
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  Das Fahrprofil ändert Gasannahme, Schaltstrategie, Verbrauch und Belastung – die Spitzenleistung der Stufe ({nf(r.ps)} PS) bleibt in jedem Profil gleich.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => void save()} disabled={saved === `${stage}-${profile}`}>
                    {saved === `${stage}-${profile}` ? <Check className="size-4 text-ok" /> : <BookmarkPlus className="size-4" />}
                    {saved === `${stage}-${profile}` ? "In der Garage gespeichert" : "Simulation speichern"}
                  </Button>
                  <LinkButton href="/konfigurator" variant="quiet">Komponenten anpassen</LinkButton>
                </div>
              </div>
            </Card>
            <LoadPanel r={r} model={sim.model} thermal={pr.thermal} />
          </div>
        </section>

        <section>
          <SectionTitle hint={`bei ${r.label}`}>Fahrprofile im Vergleich</SectionTitle>
          <Card className="overflow-hidden">
            <div className="scroll-x">
              <table className="w-full min-w-[720px] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line-soft text-[0.6875rem] uppercase tracking-wider text-muted">
                    <th className="px-4 py-2.5 text-left font-medium">Profil</th>
                    <th className="px-3 py-2.5 text-right font-medium">Leistung</th>
                    <th className="px-3 py-2.5 text-right font-medium">0–100</th>
                    <th className="px-3 py-2.5 text-right font-medium">80–120</th>
                    <th className="px-3 py-2.5 text-right font-medium">Verbrauch</th>
                    <th className="px-3 py-2.5 text-right font-medium">Therm. Last</th>
                    <th className="px-4 py-2.5 text-left font-medium">Charakter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {PROFILE_ORDER.map((id) => {
                    const x = profiles[id];
                    return (
                      <tr key={id} className={clsx("cursor-pointer transition-colors hover:bg-raised/60", id === profile && "bg-raised/70")} onClick={() => setProfile(id)}>
                        <th scope="row" className="px-4 py-3 text-left">
                          <span className="font-semibold">{PROFILES[id].name}</span>
                          <span className="block max-w-52 text-[0.6875rem] font-normal leading-snug text-muted">{PROFILES[id].goal}</span>
                        </th>
                        <td className="num whitespace-nowrap px-3 py-3 text-right">{nf(r.ps)} PS</td>
                        <td className="num whitespace-nowrap px-3 py-3 text-right">{nf(x.acc0100, 1)} s</td>
                        <td className="num whitespace-nowrap px-3 py-3 text-right">{nf(x.acc80120, 1)} s</td>
                        <td className="num whitespace-nowrap px-3 py-3 text-right">{x.consumption != null ? nf(x.consumption, 1) : "–"}</td>
                        <td className="num whitespace-nowrap px-3 py-3 text-right">{x.thermal} %</td>
                        <td className="px-4 py-3 text-xs leading-snug text-fg-2">{PROFILES[id].traits.join(" · ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-2 text-xs text-muted">Beschleunigungswerte bei Volllast mit der Schalt- und Anfahrstrategie des jeweiligen Profils (simuliert). Verbrauch: Schätzung bei gleicher Fahrweise.</p>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section>
            <SectionTitle hint={r.label}>Benötigte Komponenten</SectionTitle>
            <HardwareList e={r.evaluation} model={sim.model} />
          </section>
          <section>
            <SectionTitle hint={r.label}>Kostenübersicht</SectionTitle>
            <CostTable costs={r.evaluation.costs} />
          </section>
        </div>

        <section>
          <SectionTitle>Risiken und Grenzen</SectionTitle>
          <div className="space-y-3">
            <IssueList issues={r.evaluation.issues} />
            {sim.model.weaknesses.length > 0 && (
              <Card className="p-4 md:p-5">
                <p className="eyebrow mb-3">Bekannte Schwachstellen · {sim.model.familyName}</p>
                <ul className="list-disc space-y-1.5 pl-5 text-[0.8125rem] leading-relaxed text-fg-2">
                  {sim.model.weaknesses.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </Card>
            )}
            {sim.model.fuelNote && <Notice title="Kraftstoff">{sim.model.fuelNote}</Notice>}
          </div>
        </section>

        <div className="space-y-3">
          <Assumptions items={sim.assumptions} notes={sim.model.notes} />
          <LegalBlock />
        </div>
      </div>
    </div>
  );
}
