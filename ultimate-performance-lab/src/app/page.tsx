import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { OpenVehicleButton, RecentAndGarage } from "@/components/dashboard-live";
import { Hero } from "@/components/hero";
import { Card, GradeBadge, SectionTitle } from "@/components/ui";
import { allVehicles, brandSummaries, getVehicle } from "@/lib/data/catalog";
import { resolveTuning } from "@/lib/engine/families";
import { simulateVehicle } from "@/lib/engine/simulate";

const FEATURED = ["bmw-4er-g22-430i-245-rwd", "vw-golf-8-r", "mercedes-a45s-w177", "audi-rs3-8y", "porsche-911-992-carrera-s", "tesla-model-3-performance-2024"];
const BRANDS_TOP = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche", "Toyota", "Ford", "Honda", "Hyundai", "Tesla", "Ferrari", "Lamborghini"];
const COMPARES = [
  { title: "Mittelklasse-Coupés und -Limousinen, Stage 2", ids: ["bmw-4er-g22-430i-245-rwd", "mercedes-c300-w206", "audi-a5-f5-45tfsi"], stage: "stage2" },
  { title: "Kompaktsportler mit Allrad, Stage 1", ids: ["vw-golf-8-r", "mercedes-a45s-w177", "audi-rs3-8y"], stage: "stage1" },
  { title: "430i: Serie gegen alle Stufen", ids: ["bmw-4er-g22-430i-245-rwd"], stage: "alle" },
];
const FOCUS = ["bmw-4er-g22-430i-245-rwd", "mercedes-a45s-w177", "porsche-911-992-gt3", "tesla-model-3-performance-2024"];

export default function Dashboard() {
  const brands = brandSummaries();
  const vehicles = allVehicles();
  const featured = FEATURED.map((id) => getVehicle(id)!).map((v) => ({ v, sim: simulateVehicle(v) }));
  const sourced = vehicles.filter((v) => v.sources?.length);
  const focus = FOCUS.map((id) => getVehicle(id)!).map((v) => ({ v, m: resolveTuning(v) }));

  return (
    <div className="space-y-8 md:space-y-10">
      <Hero brands={brands.length} variants={vehicles.length} />

      <RecentAndGarage />

      <section>
        <SectionTitle hint="Serie → Stage 1">Ausgearbeitete Modelle</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map(({ v, sim }, i) => (
            <OpenVehicleButton key={v.id} id={v.id} className="card group p-5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">{i === 0 ? "Referenzmodell" : v.generation}</p>
                  <p className="mt-1.5 truncate text-[0.9375rem] font-semibold">
                    {v.brand === "Mercedes-Benz" ? "" : `${v.brand} `}
                    {v.variant}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">{v.engine.name}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div className="mt-5 flex items-end gap-4">
                <div>
                  <p className="num text-2xl font-semibold">{v.power.ps}</p>
                  <p className="text-[0.6875rem] text-muted">PS Serie</p>
                </div>
                <div className="mb-3 h-px flex-1 bg-gradient-to-r from-line to-accent" />
                <div className="text-right">
                  <p className="num text-2xl font-semibold text-accent">{sim.stages.stage1.ps}</p>
                  <p className="text-[0.6875rem] text-muted">{sim.model.powerTuningAvailable ? "PS Stage 1" : "keine Freigabe belegt"}</p>
                </div>
              </div>
            </OpenVehicleButton>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint={<Link href="/datenbank" className="hover:text-fg">Alle {brands.length} Marken →</Link>}>Marken</SectionTitle>
        <div className="scroll-x -mx-4 flex gap-2 px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {BRANDS_TOP.map((name) => {
            const b = brands.find((x) => x.name === name)!;
            return (
              <Link key={name} href={`/datenbank?marke=${b.id}`} className="flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:border-accent">
                {name}
                <span className="num text-xs text-muted">{b.models.length}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle>Vergleiche</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {COMPARES.map((c) => (
              <Link key={c.title} href={`/vergleich?ids=${c.ids.join(",")}&stage=${c.stage}`} className="group flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-raised">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{c.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{c.ids.map((id) => getVehicle(id)!.variant.replace("Mercedes-AMG ", "")).join(" · ")}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted" />
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle hint="mit Quellenangabe">Neu belegte Fahrzeugdaten</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {sourced.slice(0, 3).map((v) => (
              <OpenVehicleButton key={v.id} id={v.id} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-raised">
                <GradeBadge grade="A" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {v.brand} {v.variant} · {v.power.ps} PS
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {v.sources!.length} Quellen · recherchiert am {new Date(v.sources![0].retrievedAt).toLocaleDateString("de-DE")}
                  </span>
                </span>
              </OpenVehicleButton>
            ))}
          </Card>
        </section>
      </div>

      <section>
        <SectionTitle hint="aus den Motormodellen">Technik im Fokus</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {focus.map(({ v, m }) => (
            <Card key={v.id} className="p-5">
              <p className="eyebrow">{m.familyName}</p>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{m.weaknesses[0] ?? m.notes[0]}</p>
              <OpenVehicleButton id={v.id} className="mt-3 text-xs font-medium text-accent hover:underline">
                {v.variant.startsWith("Mercedes") ? v.variant : `${v.brand} ${v.variant}`} öffnen →
              </OpenVehicleButton>
            </Card>
          ))}
        </div>
      </section>

      <p className="pb-2 text-xs leading-relaxed text-muted">
        Ultimate Performance Lab ist ein Simulations- und Informationswerkzeug. Es programmiert keine Steuergeräte. Leistungssteigerungen sind in Deutschland und Österreich eintragungs- bzw. genehmigungspflichtig.
      </p>
    </div>
  );
}
