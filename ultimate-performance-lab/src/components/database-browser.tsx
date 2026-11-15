"use client";

import clsx from "clsx";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BrandSummary } from "@/lib/data/catalog";
import { OpenVehicleButton } from "./dashboard-live";
import { Card, Chip, inputCls, SectionTitle } from "./ui";

export interface SlimVehicle {
  id: string;
  brand: string;
  model: string;
  title: string;
  subtitle: string;
  sourced: boolean;
}

export function DatabaseBrowser({ brands, vehicles }: { brands: BrandSummary[]; vehicles: SlimVehicle[] }) {
  const [q, setQ] = useState("");
  const [onlyData, setOnlyData] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setBrandId(new URLSearchParams(window.location.search).get("marke"));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const go = (id: string | null) => {
    window.history.pushState(null, "", id ? `/datenbank?marke=${id}` : "/datenbank");
    setBrandId(id);
    window.scrollTo({ top: 0 });
  };

  const list = useMemo(() => {
    const f = q.trim().toLowerCase();
    return brands.filter((b) => (!onlyData || b.variantCount > 0) && (!f || b.name.toLowerCase().includes(f) || b.country.toLowerCase().includes(f) || b.models.some((m) => m.toLowerCase().includes(f))));
  }, [brands, q, onlyData]);
  const brand = brands.find((b) => b.id === brandId);

  if (brand) {
    const vs = vehicles.filter((v) => v.brand === brand.name);
    return (
      <div>
        <button type="button" onClick={() => go(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg"><ArrowLeft className="size-4" />Alle Marken</button>
        <div className="mb-6">
          <p className="eyebrow">{brand.country}</p>
          <h2 className="mt-1.5 text-3xl font-semibold tracking-tight">{brand.name}</h2>
          <p className="mt-1.5 text-sm text-fg-2">{brand.models.length} Baureihen im Verzeichnis · {vs.length} Varianten mit technischem Datensatz</p>
        </div>
        {vs.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Varianten mit Datensatz</SectionTitle>
            <Card className="divide-y divide-line-soft">
              {vs.map((v) => (
                <OpenVehicleButton key={v.id} id={v.id} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-raised">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{v.title}</span><span className="block truncate text-xs text-muted">{v.subtitle}</span></span>
                  {v.sourced && <span className="shrink-0 rounded-md border border-ok/40 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-ok">Quellen belegt</span>}
                </OpenVehicleButton>
              ))}
            </Card>
          </section>
        )}
        <SectionTitle hint="Punkt = Datensatz vorhanden">Baureihen</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {brand.models.map((m) => {
            const has = brand.modelsWithData.includes(m);
            return (
              <Link key={m} href={has ? `/fahrzeuge` : `/fahrzeuge?eigenes=1&marke=${encodeURIComponent(brand.name)}&modell=${encodeURIComponent(m)}`} className="group flex min-h-12 items-center justify-between gap-2 rounded-xl border border-line-soft bg-surface px-3.5 py-2.5 text-sm transition-colors hover:border-line">
                <span className="truncate">{m}</span>
                {has ? <span className="size-1.5 shrink-0 rounded-full bg-accent" /> : <Plus className="size-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">Baureihen ohne Punkt sind im Verzeichnis geführt, haben aber noch keinen geprüften technischen Datensatz. Ein Klick legt sie mit eigenen Daten an – es werden keine Werte erfunden.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className={clsx(inputCls, "sm:max-w-sm")} placeholder="Marke, Land oder Baureihe filtern …" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Marken filtern" />
        <Chip active={onlyData} onClick={() => setOnlyData((x) => !x)}>Nur mit technischen Datensätzen</Chip>
        <span className="text-xs text-muted sm:ml-auto">{list.length} von {brands.length} Marken</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((b) => (
          <button key={b.id} type="button" onClick={() => go(b.id)} className="card group p-4 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line">
            <p className="truncate text-sm font-semibold">{b.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{b.country}</p>
            <p className="mt-3 flex items-center justify-between text-xs">
              <span className="text-fg-2"><span className="num">{b.models.length}</span> Baureihen</span>
              {b.variantCount > 0 && <span className="num rounded-md bg-accent/15 px-1.5 py-0.5 text-accent">{b.variantCount}</span>}
            </p>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted">Keine Marke passt zum Filter.</p>}
    </div>
  );
}
