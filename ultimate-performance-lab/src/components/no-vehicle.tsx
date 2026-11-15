"use client";

import { CarSilhouette } from "./car";
import { VehicleSearch } from "./vehicle-search";
import { LinkButton } from "./ui";

export function NoVehicle({ what }: { what: string }) {
  return (
    <div className="card mx-auto max-w-2xl px-5 py-10 text-center md:px-10">
      <CarSilhouette className="mx-auto w-64 opacity-60" glow={false} />
      <h2 className="mt-4 text-xl font-semibold tracking-tight">Noch kein Fahrzeug gewählt</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-fg-2">{what}</p>
      <div className="mt-6 text-left">
        <VehicleSearch />
      </div>
      <div className="mt-4">
        <LinkButton href="/fahrzeuge" variant="quiet" size="sm">
          Schritt für Schritt auswählen
        </LinkButton>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Lädt">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-surface" />
      <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      <div className="h-64 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
