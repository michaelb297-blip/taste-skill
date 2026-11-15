import { z } from "zod";
import { fail, handle, ok, resolveVehicle } from "@/lib/api";
import { research } from "@/lib/research";

const body = z.object({ vehicleId: z.string().optional(), vehicle: z.unknown().optional(), refresh: z.boolean().optional() });

export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    const v = resolveVehicle(b);
    if (!v) return fail("Fahrzeug nicht gefunden.", 404);
    return ok(await research(v, { refresh: b.refresh }));
  });
}
