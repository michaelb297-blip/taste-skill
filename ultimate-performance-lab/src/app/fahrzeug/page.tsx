"use client";

import { Activity, BookmarkPlus, Check, Gauge, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { NoVehicle, PageSkeleton } from "@/components/no-vehicle";
import { ResearchPanel } from "@/components/research-panel";
import { SpecTable } from "@/components/spec-table";
import { BasisBadge, Button, Card, GradeBadge, LinkButton, Notice, ProvBadge, SectionTitle } from "@/components/ui";
import { VehicleMedia } from "@/components/vehicle-media";
import { nf } from "@/lib/client/format";
import { useApp, vehicleTitle } from "@/lib/client/store";
import { useSim } from "@/lib/client/use-sim";
import { KIND_LABEL } from "@/lib/engine/families";
import { STAGE_COLOR, STAGE_ORDER } from "@/lib/types";

export default function VehicleOverviewPage() {
  const { ready, sim } = useSim();
  const { addGarage, garage } = useApp();
  const [saved, setSaved] = useState(false);
  if (!ready) return <PageSkeleton />;
  if (!sim) return <NoVehicle what="Wähle ein Fahrzeug, um Datenblatt, Quellen und alle Tuning-Stufen zu sehen." />;
  const v = sim.vehicle;
  const inGarage = saved || garage.some((g) => g.kind === "fahrzeug" && g.payload.vehicleId === v.id);
  const s = sim.stages;

  return (
    <div className="space-y-8">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="eyebrow">
            {v.brand} · {v.model}
            {v.generation ? ` · ${v.generation}` : ""}
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight md:text-4xl">{vehicleTitle(v)}</h1>
          <p className="mt-2 text-sm text-fg-2">
            {v.engine.name} · {KIND_LABEL[sim.model.kind]} · {v.yearTo ? `${v.yearFrom}–${v.yearTo}` : `seit ${v.yearFrom}`}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line-soft bg-line-soft">
            {[
              [nf(v.power.ps), "PS", `${nf(v.power.kw)} kW`],
              [nf(v.torque.nm), "Nm", "Drehmoment"],
              [s.stock.acc0100.value != null ? nf(s.stock.acc0100.value, 1) : "–", "s", "0–100 km/h"],
              [v.performance.vmax ? nf(v.performance.vmax) : nf(s.stock.vmaxUnlimited.value), "km/h", v.performance.vmax ? (v.performance.vmaxLimited ? "begrenzt" : "Höchstgeschw.") : "simuliert"],
              [nf(v.weightKg), "kg", `Leergewicht${v.weightBasis ? ` ${v.weightBasis}` : ""}`],
              [nf(s.stock.psPerTon), "PS/t", "Leistungsgewicht"],
            ].map(([n, u, l]) => (
              <div key={l} className="bg-surface px-4 py-3.5">
                <dt className="text-[0.6875rem] text-muted">{l}</dt>
                <dd className="mt-1">
                  <span className="num text-xl font-semibold md:text-2xl">{n}</span> <span className="text-xs text-muted">{u}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href="/simulator" variant="primary"><Gauge className="size-4" />Performance simulieren</LinkButton>
            <LinkButton href="/pruefstand"><Activity className="size-4" />Prüfstand</LinkButton>
            <LinkButton href="/konfigurator"><SlidersHorizontal className="size-4" />Konfigurator</LinkButton>
            <Button
              variant="quiet"
              disabled={inGarage}
              onClick={async () => {
                await addGarage({ kind: "fahrzeug", title: vehicleTitle(v), payload: v.custom ? { vehicleId: v.id, vehicle: v } : { vehicleId: v.id } });
                setSaved(true);
              }}
            >
              {inGarage ? <Check className="size-4 text-ok" /> : <BookmarkPlus className="size-4" />}
              {inGarage ? "In der Garage" : "In Garage speichern"}
            </Button>
          </div>
        </div>
        <VehicleMedia vehicle={v} />
      </header>

      {v.notes?.map((n) => (
        <Notice key={n} tone={/nicht belegt|Annahme/.test(n) ? "warn" : "info"}>{n}</Notice>
      ))}

      <section>
        <SectionTitle hint={sim.model.familyName}>Tuning-Stufen im Überblick</SectionTitle>
        <div className="scroll-x -mx-4 flex gap-3 px-4 pb-1 md:mx-0 md:grid md:grid-cols-5 md:px-0">
          {STAGE_ORDER.map((id) => {
            const r = s[id];
            return (
              <Card key={id} className="w-44 shrink-0 p-4 md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[id] }} />
                  <span className="text-xs font-medium text-fg-2">{r.label}</span>
                </div>
                <p className="mt-3">
                  <span className="num text-2xl font-semibold">{nf(r.ps)}</span> <span className="text-xs text-muted">PS</span>
                </p>
                <p className="num mt-0.5 text-sm text-fg-2">{nf(r.nm)} Nm</p>
                <p className="num mt-2 text-xs text-muted">
                  {r.acc0100.value != null ? `${nf(r.acc0100.value, 1)} s` : "–"} · {id === "stock" ? "Serie" : `+${nf(r.gainPct)} %`}
                </p>
                <div className="mt-3"><ProvBadge prov={r.psProv} /></div>
              </Card>
            );
          })}
        </div>
        <div className="mt-3"><BasisBadge basis={s.stage1.basis} confidence={sim.model.confidence} /></div>
      </section>

      <section>
        <SectionTitle>Technische Daten</SectionTitle>
        <SpecTable vehicle={v} />
      </section>

      {v.conflicts?.map((c) => (
        <section key={c.field}>
          <SectionTitle hint="Quellen widersprechen sich">{c.field}: abweichende Angaben</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {c.values.map((x) => (
              <div key={x.source.url} className="flex items-center gap-3 px-4 py-3">
                <GradeBadge grade={x.source.grade} />
                <span className="num min-w-0 flex-1 text-sm">{x.value}</span>
                <a href={x.source.url} target="_blank" rel="noopener noreferrer" className="max-w-[45%] truncate text-xs text-muted underline-offset-2 hover:text-accent hover:underline">{x.source.title}</a>
              </div>
            ))}
          </Card>
        </section>
      ))}

      <ResearchPanel vehicle={v} />
    </div>
  );
}
