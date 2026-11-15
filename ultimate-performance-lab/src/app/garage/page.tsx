"use client";

import { ArrowUpRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageSkeleton } from "@/components/no-vehicle";
import { Card, Chip, LinkButton, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { dateDe, euroRange, nf } from "@/lib/client/format";
import { useApp, type GarageItem, type GarageKind } from "@/lib/client/store";
import { PROFILES } from "@/lib/engine/profiles";
import { STAGE_LABEL, type ProfileId, type StageId, type Vehicle } from "@/lib/types";

const KIND: Record<GarageKind, string> = { fahrzeug: "Fahrzeuge", simulation: "Simulationen", konfiguration: "Konfigurationen", vergleich: "Vergleiche" };
const KINDS = Object.keys(KIND) as GarageKind[];

export default function GaragePage() {
  const { ready, garage, removeGarage, user, selectVehicle, setVehicle } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<GarageKind | "alle">("alle");

  const items = useMemo(() => garage.filter((g) => filter === "alle" || g.kind === filter), [garage, filter]);
  // Performance-Verlauf: gespeicherte Simulationen je Fahrzeug, chronologisch
  const history = useMemo(() => {
    const m = new Map<string, GarageItem[]>();
    for (const g of garage) if ((g.kind === "simulation" || g.kind === "konfiguration") && typeof g.payload.ps === "number") m.set(String(g.payload.vehicleId), [...(m.get(String(g.payload.vehicleId)) ?? []), g]);
    return [...m.entries()].filter(([, list]) => list.length >= 2).map(([id, list]) => ({ id, list: [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }));
  }, [garage]);

  if (!ready) return <PageSkeleton />;

  const open = async (g: GarageItem) => {
    const p = g.payload;
    if (g.kind === "vergleich") {
      const es = (p.entries as { vehicleId: string; stage: string }[]) ?? [];
      router.push(`/vergleich?ids=${es.map((e) => encodeURIComponent(e.vehicleId)).join(",")}&stages=${es.map((e) => e.stage).join(",")}`);
      return;
    }
    if (p.vehicle) setVehicle(p.vehicle as Vehicle);
    else if (!(await selectVehicle(String(p.vehicleId)))) return;
    if (g.kind === "konfiguration") {
      sessionStorage.setItem("upl.loadConfig", JSON.stringify({ vehicleId: p.vehicleId, config: p.config }));
      router.push("/konfigurator");
    } else router.push(g.kind === "simulation" ? "/simulator" : "/fahrzeug");
  };

  return (
    <div>
      <PageHeader eyebrow="Meine Garage" title="Gespeicherte Fahrzeuge und Simulationen" actions={!user ? <LinkButton href="/konto/anmelden" variant="primary">Anmelden</LinkButton> : undefined}>
        {user ? `Gespeichert im Konto von ${user.name} – auf allen Geräten verfügbar.` : "Gastmodus: Einträge liegen nur auf diesem Gerät. Nach der Anmeldung werden sie in dein Konto übernommen."}
      </PageHeader>

      <div className="scroll-x -mx-4 mb-5 flex gap-2 px-4 md:mx-0 md:px-0">
        <Chip active={filter === "alle"} onClick={() => setFilter("alle")}>Alle <span className="num text-xs text-muted">{garage.length}</span></Chip>
        {KINDS.map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{KIND[k]} <span className="num text-xs text-muted">{garage.filter((g) => g.kind === k).length}</span></Chip>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="px-5 py-10 text-center">
          <p className="text-sm text-fg-2">{garage.length === 0 ? "Deine Garage ist leer. Speichere ein Fahrzeug, eine Simulation oder einen Vergleich – der Speichern-Knopf steht auf jeder Ergebnisseite." : "Keine Einträge in dieser Kategorie."}</p>
          {garage.length === 0 && <div className="mt-5"><LinkButton href="/fahrzeuge" variant="primary">Fahrzeug auswählen</LinkButton></div>}
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((g) => {
            const p = g.payload;
            return (
              <Card key={g.id} className="flex flex-col p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">{KIND[g.kind].replace(/e?n$/, "").replace("Fahrzeuge", "Fahrzeug")} · {dateDe(g.createdAt)}</p>
                    <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug">{g.title}</p>
                  </div>
                  <button type="button" onClick={() => void removeGarage(g.id)} aria-label={`${g.title} löschen`} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {(g.kind === "simulation" || g.kind === "konfiguration") && (
                  <dl className="mt-4 grid grid-cols-4 gap-2 text-xs">
                    <div><dt className="text-muted">Leistung</dt><dd className="num mt-0.5 text-sm text-fg">{nf(p.ps as number)} PS</dd></div>
                    <div><dt className="text-muted">Drehmoment</dt><dd className="num mt-0.5 text-sm text-fg">{nf(p.nm as number)} Nm</dd></div>
                    <div><dt className="text-muted">0–100</dt><dd className="num mt-0.5 text-sm text-fg">{p.acc0100 != null ? `${nf(p.acc0100 as number, 1)} s` : "–"}</dd></div>
                    <div><dt className="text-muted">{g.kind === "simulation" ? "Stufe · Profil" : "Kosten"}</dt><dd className="mt-0.5 text-sm text-fg">{g.kind === "simulation" ? `${STAGE_LABEL[p.stage as StageId]?.replace("Stage ", "S") ?? "–"} · ${PROFILES[p.profile as ProfileId]?.name ?? "–"}` : Array.isArray(p.costs) ? <span className="num text-xs">{euroRange(p.costs as [number, number])}</span> : "–"}</dd></div>
                  </dl>
                )}
                {g.kind === "vergleich" && (
                  <ul className="mt-3 space-y-1 text-xs text-fg-2">
                    {((p.entries as { title: string; stage: StageId; ps: number }[]) ?? []).map((e, i) => (
                      <li key={i} className="flex justify-between gap-3"><span className="truncate">{e.title} · {STAGE_LABEL[e.stage]}</span><span className="num shrink-0">{nf(e.ps)} PS</span></li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => void open(g)} className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-medium text-accent hover:underline">
                  Öffnen <ArrowUpRight className="size-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <SectionTitle hint="aus gespeicherten Simulationen">Performance-Verläufe</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {history.map(({ id, list }) => {
              const max = Math.max(...list.map((g) => g.payload.ps as number));
              return (
                <Card key={id} className="p-4 md:p-5">
                  <p className="text-sm font-semibold">{list[0].title.split(" · ")[0]}</p>
                  <div className="mt-3 space-y-2">
                    {list.map((g) => (
                      <div key={g.id}>
                        <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-fg-2">{dateDe(g.createdAt)} · {g.title.split(" · ").slice(1).join(" · ")}</span><span className="num shrink-0">{nf(g.payload.ps as number)} PS</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full bg-accent" style={{ width: `${((g.payload.ps as number) / max) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {!user && garage.length > 0 && <div className="mt-6"><Notice>Gast-Einträge gehen verloren, wenn die Browserdaten gelöscht werden. Mit einem Konto bleiben sie erhalten.</Notice></div>}
    </div>
  );
}
