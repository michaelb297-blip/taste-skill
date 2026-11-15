"use client";

import clsx from "clsx";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dateDe } from "@/lib/client/format";
import type { ResearchReport } from "@/lib/research/types";
import { GRADE_LABEL, type SourceGrade, type Vehicle } from "@/lib/types";
import { Button, Card, GradeBadge, Notice, SectionTitle } from "./ui";

const body = (v: Vehicle, extra: object = {}) => JSON.stringify(v.custom ? { vehicle: v, ...extra } : { vehicleId: v.id, ...extra });

/** Live-Recherche mit Quellenbewertung A–F und offenem Status jeder Datenquelle. */
export function ResearchPanel({ vehicle }: { vehicle: Vehicle }) {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(vehicle, { refresh }) });
        if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Recherche fehlgeschlagen");
        setReport((await res.json()) as ResearchReport);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Recherche fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    },
    [vehicle],
  );
  useEffect(() => {
    void load(false);
  }, [load]);

  const findings = report?.findings ?? [];
  const shown = showAll ? findings : findings.slice(0, 8);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle hint={report ? `Stand ${dateDe(report.generatedAt)}${report.fromCache ? " · aus Zwischenspeicher" : ""}` : undefined}>Recherche und Quellen</SectionTitle>
        <Button size="sm" onClick={() => void load(true)} disabled={loading} className="mb-3">
          <RefreshCw className={clsx("size-3.5", loading && "animate-spin")} />
          Aktualisieren
        </Button>
      </div>

      {error && <Notice tone="bad">{error}</Notice>}
      {report && (
        <div className="space-y-3">
          <Notice tone={report.live ? "ok" : "warn"} title={report.live ? "Live-Recherche aktiv" : "Keine Live-Recherche"}>
            {report.notice}
          </Notice>

          <Card className="p-4">
            <p className="eyebrow mb-3">Datenquellen</p>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {report.providers.map((p) => (
                <li key={p.id} className="flex items-start gap-2.5 text-[0.8125rem]">
                  <span className={clsx("mt-1.5 size-1.5 shrink-0 rounded-full", p.ok ? "bg-ok" : p.configured ? "bg-bad" : "bg-line")} />
                  <span className="min-w-0">
                    <span className="text-fg">{p.label}</span>
                    <span className="block text-xs text-muted">{p.message}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {findings.length === 0 ? (
            <Card className="p-5 text-sm text-fg-2">Zu diesem Fahrzeug sind keine Belege hinterlegt. Alle Stufenwerte stammen aus der Berechnungsengine und sind entsprechend gekennzeichnet.</Card>
          ) : (
            <Card className="divide-y divide-line-soft">
              {shown.map((f) => (
                <article key={f.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <GradeBadge grade={f.grade} />
                    <div className="min-w-0 flex-1">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="group inline-flex max-w-full items-center gap-1.5 text-sm font-medium hover:text-accent">
                        <span className="truncate">{f.title}</span>
                        <ExternalLink className="size-3 shrink-0 text-muted group-hover:text-accent" />
                      </a>
                      {f.snippet && <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-2">{f.snippet}</p>}
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem] text-muted">
                        <span>{GRADE_LABEL[f.grade]}</span>
                        <span>{f.gradeReason}</span>
                        <span>Leistung bezogen auf: {f.measuredAt === "rad" ? "Räder" : f.measuredAt === "motor" ? "Motor" : "nicht angegeben"}</span>
                        <span>recherchiert am {dateDe(f.retrievedAt)}</span>
                        {!f.curated && <span className="text-warn">automatische Fundstelle, ungeprüft</span>}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {findings.length > 8 && (
                <button type="button" onClick={() => setShowAll((s) => !s)} className="w-full rounded-b-2xl px-4 py-3 text-xs font-medium text-accent hover:bg-raised">
                  {showAll ? "Weniger anzeigen" : `Alle ${findings.length} Quellen anzeigen`}
                </button>
              )}
            </Card>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 pt-1">
            {(Object.keys(GRADE_LABEL) as SourceGrade[]).map((g) => (
              <GradeBadge key={g} grade={g} withLabel />
            ))}
          </div>
        </div>
      )}
      {loading && !report && <div className="h-40 animate-pulse rounded-2xl bg-surface" />}
    </section>
  );
}
