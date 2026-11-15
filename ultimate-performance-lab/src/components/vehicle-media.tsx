"use client";

import { useEffect, useState } from "react";
import type { ImageReport } from "@/lib/research/types";
import type { Vehicle } from "@/lib/types";
import { CarSilhouette } from "./car";

const VIEW: Record<string, string> = { aussen: "Außen", front: "Front", heck: "Heck", innenraum: "Innenraum", motorraum: "Motorraum" };

/** Fahrzeugbilder (Wikimedia Commons) – mit neutraler Darstellung als Rückfallebene. */
export function VehicleMedia({ vehicle }: { vehicle: Vehicle }) {
  const [rep, setRep] = useState<ImageReport | null>(null);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    let live = true;
    setRep(null);
    setIdx(0);
    fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vehicle.custom ? { vehicle } : { vehicleId: vehicle.id }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setRep(d ?? { vehicleId: vehicle.id, live: false, fromCache: false, images: [], notice: "Bildquelle nicht erreichbar. Es wird eine neutrale Fahrzeugdarstellung verwendet." }))
      .catch(() => live && setRep({ vehicleId: vehicle.id, live: false, fromCache: false, images: [], notice: "Bildquelle nicht erreichbar. Es wird eine neutrale Fahrzeugdarstellung verwendet." }));
    return () => {
      live = false;
    };
  }, [vehicle]);

  const imgs = rep?.images ?? [];
  const cur = imgs[idx];
  return (
    <div className="card relative overflow-hidden">
      <div className="hairline-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(90%_80%_at_50%_30%,#000,transparent)]" />
      <div className="relative flex aspect-[16/10] items-center justify-center">
        {cur ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.thumbUrl} alt={`${vehicle.brand} ${vehicle.model} – ${VIEW[cur.view]}`} className="size-full object-cover" />
        ) : (
          <CarSilhouette body={vehicle.body} className="w-[86%]" />
        )}
      </div>
      {imgs.length > 1 && (
        <div className="scroll-x relative flex gap-2 border-t border-line-soft p-2">
          {imgs.map((im, i) => (
            <button key={im.pageUrl} type="button" onClick={() => setIdx(i)} aria-label={`${VIEW[im.view]} anzeigen`} className={`h-12 w-20 shrink-0 overflow-hidden rounded-lg border ${i === idx ? "border-accent" : "border-line-soft"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.thumbUrl} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <p className="relative border-t border-line-soft px-4 py-2.5 text-[0.6875rem] leading-relaxed text-muted">
        {cur ? (
          <>
            {VIEW[cur.view]} · Foto: {cur.author} ·{" "}
            <a href={cur.pageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
              {cur.license}, Wikimedia Commons
            </a>
          </>
        ) : rep ? (
          `Neutrale Illustration, kein Foto des Fahrzeugs. ${rep.notice}`
        ) : (
          "Bilder werden gesucht …"
        )}
      </p>
    </div>
  );
}
