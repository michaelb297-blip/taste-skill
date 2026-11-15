"use client";

import { ArrowUpRight, Clock, Warehouse } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/client/store";
import { dateDe } from "@/lib/client/format";
import { Card, SectionTitle } from "./ui";

/** Zuletzt simulierte Fahrzeuge und Garage – aus dem lokalen bzw. Konto-Speicher. */
export function RecentAndGarage() {
  const { recent, garage, selectVehicle, user, ready } = useApp();
  const router = useRouter();
  const open = async (id: string) => {
    if (await selectVehicle(id)) router.push("/fahrzeug");
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section>
        <SectionTitle hint={recent.length ? `${recent.length} Fahrzeuge` : undefined}>Zuletzt simuliert</SectionTitle>
        <Card className="divide-y divide-line-soft">
          {ready && recent.length === 0 && <p className="px-4 py-6 text-sm text-fg-2">Noch nichts simuliert. Wähle oben ein Fahrzeug – die Stufen werden sofort berechnet.</p>}
          {recent.slice(0, 5).map((r) => (
            <button key={r.id} type="button" onClick={() => void open(r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-raised">
              <Clock className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.subtitle}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{dateDe(r.at)}</span>
            </button>
          ))}
        </Card>
      </section>
      <section>
        <SectionTitle>Meine Garage</SectionTitle>
        <Link href="/garage" className="card group flex h-[calc(100%-2.25rem)] min-h-32 flex-col justify-between p-5 transition-colors hover:border-line">
          <div className="flex items-start justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-raised">
              <Warehouse className="size-5 text-accent" strokeWidth={1.75} />
            </span>
            <ArrowUpRight className="size-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div>
            <p className="num text-3xl font-semibold">{garage.length}</p>
            <p className="mt-1 text-sm text-fg-2">{garage.length === 1 ? "gespeicherter Eintrag" : "gespeicherte Einträge"}</p>
            <p className="mt-1 text-xs text-muted">{user ? `Im Konto von ${user.name}` : "Gastmodus – lokal auf diesem Gerät"}</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

export function OpenVehicleButton({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { selectVehicle } = useApp();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await selectVehicle(id)) router.push("/fahrzeug");
      }}
    >
      {children}
    </button>
  );
}
