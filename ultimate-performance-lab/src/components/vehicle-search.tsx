"use client";

import clsx from "clsx";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchResult } from "@/lib/data/search";
import { useApp, vehicleSubtitle, vehicleTitle } from "@/lib/client/store";

/** Freitextsuche mit Vorschlägen; versteht z. B. "BMW G22 2022 430i 249 PS". */
export function VehicleSearch({ size = "md", autoFocus, onPick, placeholder = "BMW G22 430i 2022" }: { size?: "md" | "lg"; autoFocus?: boolean; onPick?: (id: string) => void; placeholder?: string }) {
  const { selectVehicle } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/vehicles/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (r.ok) {
          setRes((await r.json()) as SearchResult);
          setCursor(0);
        }
      } catch {
        /* abgebrochen */
      }
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = async (id: string) => {
    setBusy(true);
    setOpen(false);
    if (onPick) onPick(id);
    else {
      await selectVehicle(id);
      router.push("/fahrzeug");
    }
    setBusy(false);
    setQ("");
  };

  const hits = res?.hits ?? [];
  const lg = size === "lg";
  return (
    <div ref={box} className="relative">
      <div className={clsx("flex items-center gap-3 rounded-2xl border bg-panel/90 backdrop-blur transition-colors focus-within:border-accent", lg ? "h-16 border-line px-5" : "h-12 border-line px-4")}>
        <Search className={clsx("shrink-0 text-muted", lg ? "size-5" : "size-4")} />
        <input
          role="combobox"
          aria-expanded={open && !!res}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Fahrzeug suchen"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && hits[cursor]) void pick(hits[cursor].vehicle.id);
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={`Suche dein Fahrzeug: ${placeholder}`}
          className={clsx("min-w-0 flex-1 bg-transparent text-fg placeholder:text-muted focus:outline-none", lg ? "text-base md:text-lg" : "text-sm")}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
        />
        {busy && <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" />}
      </div>

      {open && res && q.trim().length >= 2 && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,.9)]">
          {res.hints.map((h) => (
            <p key={h} className="mx-2 my-1.5 rounded-lg border border-warn/25 bg-warn/[0.06] px-3 py-2 text-xs text-fg-2">
              {h}
            </p>
          ))}
          {hits.map((h, i) => (
            <button key={h.vehicle.id} role="option" aria-selected={i === cursor} type="button" onMouseEnter={() => setCursor(i)} onClick={() => void pick(h.vehicle.id)} className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === cursor ? "bg-raised" : "")}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{vehicleTitle(h.vehicle)}</span>
                <span className="block truncate text-xs text-muted">
                  {vehicleSubtitle(h.vehicle)} · {h.vehicle.drive}
                </span>
              </span>
              <span className="num shrink-0 text-xs text-fg-2">{h.vehicle.torque.nm} Nm</span>
              <ArrowRight className="size-4 shrink-0 text-muted" />
            </button>
          ))}
          {res.catalogOnly.length > 0 && (
            <div className="border-t border-line-soft px-3 pb-2 pt-3">
              <p className="eyebrow mb-2">Im Markenverzeichnis, ohne technischen Datensatz</p>
              <div className="flex flex-wrap gap-1.5">
                {res.catalogOnly.map((c) => (
                  <Link key={`${c.brand}-${c.model}`} href={`/fahrzeuge?eigenes=1&marke=${encodeURIComponent(c.brand)}&modell=${encodeURIComponent(c.model)}`} className="rounded-full border border-line px-3 py-1 text-xs text-fg-2 hover:border-accent hover:text-fg">
                    {c.brand} {c.model}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {hits.length === 0 && res.catalogOnly.length === 0 && (
            <div className="px-3 py-4 text-sm text-fg-2">
              Kein Treffer im lokalen Katalog.{" "}
              <Link href="/fahrzeuge?eigenes=1" className="text-accent underline-offset-4 hover:underline">
                Fahrzeug mit eigenen Daten anlegen
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
