import type { Metadata } from "next";
import { DatabaseBrowser, type SlimVehicle } from "@/components/database-browser";
import { PageHeader } from "@/components/ui";
import { allVehicles, brandSummaries, vehicleSubtitle } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Fahrzeugdatenbank" };

export default function DatabasePage() {
  const brands = brandSummaries();
  const vehicles: SlimVehicle[] = allVehicles().map((v) => ({ id: v.id, brand: v.brand, model: v.model, title: v.variant.startsWith(v.brand) || v.variant.startsWith("Mercedes") ? v.variant : `${v.brand} ${v.variant}`, subtitle: vehicleSubtitle(v), sourced: !!v.sources?.length }));
  const models = brands.reduce((a, b) => a + b.models.length, 0);
  return (
    <div>
      <PageHeader eyebrow="Fahrzeugdatenbank" title={`${brands.length} Marken, ${models.toLocaleString("de-DE")} Baureihen`}>
        Das Markenverzeichnis führt Hersteller und Baureihen. Vollständige technische Datensätze gibt es derzeit für {vehicles.length} Varianten aus {brands.filter((b) => b.variantCount > 0).length} Marken; alle anderen lassen sich mit eigenen Daten simulieren.
      </PageHeader>
      <DatabaseBrowser brands={brands} vehicles={vehicles} />
    </div>
  );
}
