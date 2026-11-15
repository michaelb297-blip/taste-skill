"use client";

import clsx from "clsx";
import { AlertTriangle, Ban, Info, Wrench } from "lucide-react";
import Link from "next/link";
import { euroRange, nf } from "@/lib/client/format";
import { LABOR_RATE, LEGAL_NOTES, SLOT_LABEL, type Costs, type Evaluation, type Issue } from "@/lib/engine/components";
import type { TuningModel } from "@/lib/engine/families";
import type { Metric, StageResult } from "@/lib/engine/simulate";
import { useApp, vehicleSubtitle, vehicleTitle } from "@/lib/client/store";
import { Card, Meter, Notice, ProvBadge } from "./ui";

export function VehicleBar() {
  const { vehicle } = useApp();
  if (!vehicle) return null;
  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface px-4 py-3">
      <Link href="/fahrzeug" className="min-w-0">
        <span className="block truncate text-sm font-medium">{vehicleTitle(vehicle)}</span>
        <span className="block truncate text-xs text-muted">{vehicleSubtitle(vehicle)} · {vehicle.engine.name}</span>
      </Link>
      <Link href="/fahrzeuge" className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-raised">Wechseln</Link>
    </div>
  );
}

/** Wert mit Unsicherheitsspanne und Herkunft. */
export function MetricValue({ m, unit, digits = 1, big }: { m: Metric | null; unit: string; digits?: number; big?: boolean }) {
  if (!m || m.value == null) return <span className="text-muted" title={m?.note}>–</span>;
  const range = m.lo != null && m.hi != null && m.lo !== m.hi;
  return (
    <span className="inline-block" title={m.note}>
      <span className={clsx("num font-medium text-fg", big ? "text-2xl md:text-3xl" : "text-sm")}>{nf(m.value, digits)}</span>
      <span className={clsx("text-muted", big ? "ml-1 text-xs" : "ml-0.5 text-[0.6875rem]")}>{unit}</span>
      {range && <span className="num block text-[0.6875rem] leading-tight text-muted">{nf(m.lo!, digits)}–{nf(m.hi!, digits)}</span>}
    </span>
  );
}

export function Flags({ e }: { e: Evaluation }) {
  const f = e.flags;
  const items = [
    f.trackOnly && ["Track-only", "bad"],
    f.notRoadLegal && ["Nicht straßenzulässig", "bad"],
    f.highRisk && ["Erhöhtes Ausfallrisiko", "bad"],
    f.highMaintenance && ["Erhöhter Wartungsaufwand", "warn"],
    !f.trackOnly && f.needsApproval && ["Eintragungspflichtig", "warn"],
  ].filter(Boolean) as [string, string][];
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, tone]) => (
        <span key={label} className={clsx("inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[0.6875rem] font-semibold uppercase tracking-wider", tone === "bad" ? "border-bad/45 bg-bad/10 text-bad" : "border-warn/40 bg-warn/10 text-warn")}>
          {tone === "bad" ? <Ban className="size-3" /> : <AlertTriangle className="size-3" />}
          {label}
        </span>
      ))}
    </div>
  );
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="space-y-2">
      {issues.map((i) => (
        <li key={i.text} className={clsx("flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.8125rem] leading-relaxed", i.level === "error" ? "border-bad/40 bg-bad/[0.07] text-fg" : i.level === "warn" ? "border-warn/30 bg-warn/[0.05] text-fg-2" : "border-line bg-raised text-fg-2")}>
          {i.level === "info" ? <Info className="mt-0.5 size-4 shrink-0 text-accent" /> : <AlertTriangle className={clsx("mt-0.5 size-4 shrink-0", i.level === "error" ? "text-bad" : "text-warn")} />}
          <span>{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function LoadPanel({ r, model, thermal }: { r: StageResult; model: TuningModel; thermal?: number }) {
  const e = r.evaluation;
  const electric = !model.powerTuningAvailable;
  return (
    <Card className="space-y-4 p-4 md:p-5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Belastung und Zuverlässigkeit</p>
        <p className="text-xs text-fg-2">
          Einschätzung: <span className={clsx("font-semibold", e.reliability.score >= 70 ? "text-ok" : e.reliability.score >= 55 ? "text-warn" : "text-bad")}>{e.reliability.label}</span>
        </p>
      </div>
      <Meter label="Thermische Belastung" value={thermal ?? e.loads.thermal} hint="Kennzahl aus Leistungszuwachs, Ladeluft- und Zusatzkühlung sowie Fahrprofil" />
      {!electric && (
        <>
          <Meter label="Motorbelastung (Drehmoment zur Grenze des Rumpfmotors)" value={e.loads.engine} hint={`Grenze ${nf(e.hardware.some((h) => h.slot === "internals") ? model.internalsBuiltNm : model.internalsNm)} Nm – Annahme des Motormodells`} />
          <Meter label="Getriebebelastung (Drehmoment zur Übertragungsgrenze)" value={e.loads.gearbox} hint={model.gearboxAssumed ? "Getriebegrenze nicht belegt – Annahme" : "Getriebegrenze laut Datensatz bzw. Erfahrungswert"} />
        </>
      )}
      {e.limitedBy.length > 0 && (
        <p className="text-xs text-fg-2">
          Begrenzt durch: <span className="text-fg">{e.limitedBy.join(" · ")}</span>
        </p>
      )}
    </Card>
  );
}

export function HardwareList({ e, model }: { e: Evaluation; model: TuningModel }) {
  if (!e.hardware.length) return <Card className="p-5 text-sm text-fg-2">Serienzustand – keine Änderungen.</Card>;
  return (
    <Card className="divide-y divide-line-soft">
      {e.hardware.map((h) => (
        <div key={h.slot} className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <Wrench className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{h.name}</p>
              <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-fg-2">{h.description}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-[0.6875rem] text-muted">
                <span>{SLOT_LABEL[h.slot]}</span>
                <span>Einbauaufwand: {h.effort}</span>
                <span className={h.legal === "track" ? "text-bad" : h.legal === "eintragung" ? "text-warn" : ""}>{h.legal === "track" ? "praktisch nicht zulassungsfähig" : h.legal === "eintragung" ? "eintragungspflichtig" : "zulassungsneutral"}</span>
              </p>
              {model.products[h.slot]?.length ? (
                <p className="mt-1.5 text-[0.6875rem] text-muted">
                  Recherchierte Produkte:{" "}
                  {model.products[h.slot]!.map((p, i) => (
                    <span key={p.url}>
                      {i > 0 && ", "}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-fg-2 underline underline-offset-2 hover:text-accent">{p.name} ({p.maker})</a>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

export function CostTable({ costs }: { costs: Costs }) {
  if (costs.total[1] === 0) return <Card className="p-5 text-sm text-fg-2">Keine Kosten – Serienzustand.</Card>;
  return (
    <Card className="overflow-hidden">
      <div className="scroll-x">
        <table className="w-full min-w-[520px] text-[0.8125rem]">
          <thead>
            <tr className="border-b border-line-soft text-left text-[0.6875rem] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5 font-medium">Position</th>
              <th className="px-3 py-2.5 text-right font-medium">Material</th>
              <th className="px-3 py-2.5 text-right font-medium">Einbau</th>
              <th className="px-4 py-2.5 text-right font-medium">Abstimmung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {costs.items.map((i) => (
              <tr key={i.slot}>
                <td className="px-4 py-2.5">{i.name}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-fg-2">{euroRange(i.material)}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-fg-2">{i.laborH ? `${nf(i.laborH, 1)} h` : "–"}</td>
                <td className="num whitespace-nowrap px-4 py-2.5 text-right text-fg-2">{euroRange(i.tuning)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line bg-raised/60">
            <tr>
              <td className="px-4 py-2.5 text-muted">Summe</td>
              <td className="num whitespace-nowrap px-3 py-2.5 text-right">{euroRange(costs.material)}</td>
              <td className="num whitespace-nowrap px-3 py-2.5 text-right">{euroRange(costs.labor)}</td>
              <td className="num whitespace-nowrap px-4 py-2.5 text-right">{euroRange(costs.tuning)}</td>
            </tr>
            <tr className="border-t border-line-soft">
              <td className="px-4 py-3 font-semibold">Gesamtkosten (Richtwert)</td>
              <td colSpan={3} className="num px-4 py-3 text-right text-base font-semibold text-accent">{euroRange(costs.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border-t border-line-soft px-4 py-3 text-xs leading-relaxed text-muted">
        <p>Richtwerte, keine Angebote: Teilepreise nach Komponentenklasse und Zylinderzahl skaliert, Einbau mit {LABOR_RATE[0]}–{LABOR_RATE[1]} €/h (Deutschland/Österreich). Konkrete Händlerpreise sind nicht hinterlegt.</p>
        {costs.extras.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4">
            {costs.extras.map((x) => (
              <li key={x}>Zusätzlich möglich: {x}</li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function LegalBlock() {
  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-medium">
        Rechtliche Hinweise für Deutschland und Österreich
        <span className="text-xs text-muted group-open:hidden">anzeigen</span>
      </summary>
      <ul className="list-disc space-y-1.5 border-t border-line-soft px-4 py-4 pl-9 text-[0.8125rem] leading-relaxed text-fg-2">
        {LEGAL_NOTES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </details>
  );
}

export function Assumptions({ items, notes }: { items: string[]; notes: string[] }) {
  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-medium">
        Annahmen und Modellgrenzen ({items.length + notes.length})
        <span className="text-xs text-muted group-open:hidden">anzeigen</span>
      </summary>
      <ul className="list-disc space-y-1.5 border-t border-line-soft px-4 py-4 pl-9 text-[0.8125rem] leading-relaxed text-fg-2">
        {[...notes, ...items].map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </details>
  );
}

export function ProvLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
      <span className="flex items-center gap-1.5"><ProvBadge prov="katalog" /> Herstellerangabe</span>
      <span className="flex items-center gap-1.5"><ProvBadge prov="recherchiert" /> aus belegten Quellen</span>
      <span className="flex items-center gap-1.5"><ProvBadge prov="simuliert" /> Berechnungsengine</span>
      <span className="flex items-center gap-1.5"><ProvBadge prov="gemessen" /> nur bei echten Messprotokollen</span>
    </div>
  );
}

export function SimNotice() {
  return <Notice tone="warn">Alle Stufenwerte sind Simulationen bzw. recherchierte Angaben – keine Messungen an deinem Fahrzeug. Die kleine Zahlenspanne unter einem Wert zeigt den geschätzten Bereich.</Notice>;
}
