import { ok } from "@/lib/api";
import { allVehicles, brandSummaries } from "@/lib/data/catalog";

export async function GET() {
  const brands = brandSummaries();
  return ok({ brands, totals: { brands: brands.length, models: brands.reduce((a, b) => a + b.models.length, 0), variants: allVehicles().length } });
}
