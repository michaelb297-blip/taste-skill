import { fail, ok } from "@/lib/api";
import { getVehicle } from "@/lib/data/catalog";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const v = getVehicle(decodeURIComponent(id));
  return v ? ok(v) : fail("Fahrzeug nicht gefunden.", 404);
}
