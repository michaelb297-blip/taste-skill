"use client";

import clsx from "clsx";
import { Check, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, Chip, inputCls, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { VehicleForm } from "@/components/vehicle-form";
import { VehicleSearch } from "@/components/vehicle-search";
import { useApp, vehicleSubtitle, vehicleTitle } from "@/lib/client/store";
import type { BrandSummary, Selection, SelectionStep } from "@/lib/data/catalog";

const STEPS: { key: SelectionStep; label: string }[] = [
  { key: "brand", label: "Hersteller" },
  { key: "model", label: "Modell" },
  { key: "generation", label: "Generation" },
  { key: "year", label: "Baujahr" },
  { key: "variant", label: "Motorisierung" },
  { key: "gearbox", label: "Getriebe" },
  { key: "drive", label: "Antrieb" },
];
const DRIVE: Record<string, string> = { AWD: "Allradantrieb", RWD: "Hinterradantrieb", FWD: "Vorderradantrieb" };

export default function SelectVehiclePage() {
  const { selectVehicle, saveCustomVehicle, customVehicles, removeCustomVehicle, setVehicle } = useApp();
  const router = useRouter();
  const [sel, setSel] = useState<Selection>({});
  const [state, setState] = useState<{ step: SelectionStep | "done"; options: string[]; matches: string[] } | null>(null);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [filter, setFilter] = useState("");
  const [custom, setCustom] = useState(false);
  const [prefill, setPrefill] = useState({ brand: "", model: "" });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("eigenes")) {
      setCustom(true);
      setPrefill({ brand: p.get("marke") ?? "", model: p.get("modell") ?? "" });
    }
    fetch("/api/vehicles/brands").then((r) => r.json()).then((d: { brands: BrandSummary[] }) => setBrands(d.brands)).catch(() => {});
  }, []);

  useEffect(() => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sel)) if (v != null) q.set(k, String(v));
    let live = true;
    fetch(`/api/vehicles/select?${q}`).then((r) => r.json()).then((d) => live && setState(d)).catch(() => {});
    return () => {
      live = false;
    };
  }, [sel]);

  // letzter Schritt eindeutig -> direkt zur Fahrzeugübersicht
  useEffect(() => {
    if (state?.step === "done" && state.matches.length >= 1) void selectVehicle(state.matches[0]).then((v) => v && router.push("/fahrzeug"));
  }, [state, selectVehicle, router]);

  const stepIdx = state ? (state.step === "done" ? STEPS.length : STEPS.findIndex((s) => s.key === state.step)) : 0;
  const brand = brands.find((b) => b.name === sel.brand);
  const options = useMemo(() => {
    if (!state) return [];
    const f = filter.trim().toLowerCase();
    return f && (state.step === "brand" || state.step === "model") ? state.options.filter((o) => o.toLowerCase().includes(f)) : state.options;
  }, [state, filter]);

  const choose = (value: string) => {
    if (!state || state.step === "done") return;
    setFilter("");
    setSel((s) => ({ ...s, [state.step]: state.step === "year" ? Number(value) : value }));
  };
  const backTo = (i: number) => {
    const next: Selection = {};
    STEPS.slice(0, i).forEach((s) => ((next as Record<string, unknown>)[s.key] = (sel as Record<string, unknown>)[s.key]));
    setSel(next);
    setFilter("");
  };
  const hasData = (opt: string) => (state?.step === "brand" ? (brands.find((b) => b.name === opt)?.variantCount ?? 0) > 0 : state?.step === "model" ? (brand?.modelsWithData.includes(opt) ?? false) : true);
  const noData = state && state.step !== "done" && state.step !== "brand" && state.step !== "model" && state.options.length === 0;

  return (
    <div>
      <PageHeader eyebrow="Schritt 1" title="Fahrzeug auswählen">
        Direkt suchen oder Schritt für Schritt eingrenzen: Hersteller, Modell, Generation, Baujahr, Motorisierung, Getriebe und Antrieb.
      </PageHeader>

      <VehicleSearch size="lg" />

      <div className="mt-8 flex items-center justify-between gap-3">
        <SectionTitle>{custom ? "Eigenes Fahrzeug anlegen" : "Schrittweise Auswahl"}</SectionTitle>
        <div className="mb-3 flex gap-2">
          <Chip active={!custom} onClick={() => setCustom(false)}>Katalog</Chip>
          <Chip active={custom} onClick={() => setCustom(true)}><Plus className="size-3.5" />Eigene Daten</Chip>
        </div>
      </div>

      {custom ? (
        <Card className="p-4 md:p-6">
          <VehicleForm
            key={`${prefill.brand}-${prefill.model}`}
            initialBrand={prefill.brand}
            initialModel={prefill.model}
            onSave={(v) => {
              saveCustomVehicle(v);
              router.push("/fahrzeug");
            }}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ol className="scroll-x flex items-stretch border-b border-line-soft" aria-label="Auswahlschritte">
            {STEPS.map((s, i) => {
              const value = (sel as Record<string, unknown>)[s.key];
              const done = value != null;
              const active = i === stepIdx;
              return (
                <li key={s.key} className="flex shrink-0 items-center">
                  <button type="button" disabled={!done} onClick={() => backTo(i)} aria-current={active ? "step" : undefined} className={clsx("flex h-14 flex-col justify-center px-4 text-left transition-colors", done && "hover:bg-raised", active && "bg-raised")}>
                    <span className={clsx("flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider", active ? "text-accent" : "text-muted")}>
                      {done ? <Check className="size-3 text-ok" /> : <span className="num">{i + 1}</span>}
                      {s.label}
                    </span>
                    <span className={clsx("mt-0.5 max-w-36 truncate text-[0.8125rem]", done ? "text-fg" : "text-muted")}>{done ? (s.key === "drive" ? DRIVE[String(value)] : String(value)) : "–"}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="size-3.5 shrink-0 text-line" />}
                </li>
              );
            })}
          </ol>

          <div className="p-4 md:p-6">
            {state && (state.step === "brand" || state.step === "model") && state.options.length > 12 && (
              <input className={clsx(inputCls, "mb-4 max-w-sm")} placeholder={state.step === "brand" ? "Hersteller filtern …" : "Modell filtern …"} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Optionen filtern" />
            )}
            {noData ? (
              <div className="space-y-4">
                <Notice tone="warn" title={`Für ${sel.brand} ${sel.model} liegt noch kein technischer Datensatz vor.`}>
                  Das Markenverzeichnis kennt die Baureihe, aber es sind keine geprüften technischen Daten hinterlegt – und es wird nichts erfunden. Du kannst das Fahrzeug mit eigenen Daten anlegen und sofort simulieren.
                </Notice>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active
                    onClick={() => {
                      setPrefill({ brand: sel.brand ?? "", model: sel.model ?? "" });
                      setCustom(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Mit eigenen Daten anlegen
                  </Chip>
                  <Chip onClick={() => backTo(1)}><RotateCcw className="size-3.5" />Anderes Modell</Chip>
                </div>
              </div>
            ) : (
              <div className={clsx("grid gap-2", state?.step === "variant" || state?.step === "gearbox" ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
                {options.map((o) => (
                  <button key={o} type="button" onClick={() => choose(o)} className="group flex min-h-12 items-center justify-between gap-2 rounded-xl border border-line-soft bg-panel px-3.5 py-2.5 text-left text-sm transition-colors hover:border-accent hover:bg-raised">
                    <span className="min-w-0 truncate">{state?.step === "drive" ? DRIVE[o] : o}</span>
                    {(state?.step === "brand" || state?.step === "model") && hasData(o) && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />}
                  </button>
                ))}
                {state && options.length === 0 && <p className="col-span-full text-sm text-muted">Keine Option passt zum Filter.</p>}
              </div>
            )}
            {state && (state.step === "brand" || state.step === "model") && (
              <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                <span className="size-1.5 rounded-full bg-accent" /> Technische Datensätze vorhanden – alle anderen lassen sich mit eigenen Daten simulieren.
              </p>
            )}
          </div>
        </Card>
      )}

      {customVehicles.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Eigene Fahrzeuge</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {customVehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setVehicle(v);
                    router.push("/fahrzeug");
                  }}
                >
                  <span className="block truncate text-sm font-medium">{vehicleTitle(v)}</span>
                  <span className="block truncate text-xs text-muted">{vehicleSubtitle(v)} · Eigenangaben</span>
                </button>
                <button type="button" onClick={() => removeCustomVehicle(v.id)} className="text-xs text-muted hover:text-bad">Entfernen</button>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
