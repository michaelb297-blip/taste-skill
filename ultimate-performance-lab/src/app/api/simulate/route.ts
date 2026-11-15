import { z } from "zod";
import { fail, handle, ok, resolveVehicle } from "@/lib/api";
import { profileResults, simulateConfig, simulateVehicle } from "@/lib/engine/simulate";
import { STAGE_ORDER } from "@/lib/types";

const body = z.object({
  vehicleId: z.string().optional(),
  vehicle: z.unknown().optional(),
  config: z.record(z.string(), z.string()).optional(),
  profiles: z.boolean().optional(),
});

/** Serverseitige Simulation – dieselbe Engine läuft auch im Browser. */
export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    const v = resolveVehicle(b);
    if (!v) return fail("Fahrzeug nicht gefunden.", 404);
    const sim = simulateVehicle(v);
    return ok({
      simulation: sim,
      custom: b.config ? simulateConfig(v, b.config) : undefined,
      profiles: b.profiles ? Object.fromEntries(STAGE_ORDER.map((s) => [s, profileResults(v, sim.stages[s])])) : undefined,
    });
  });
}
