import { z } from "zod";
import type { Vehicle } from "./types";

const optNum = (min: number, max: number) => z.number().min(min).max(max).optional();

/** Validierung nutzerdefinierter Fahrzeuge – verhindert unplausible Eingaben. */
export const vehicleSchema = z.object({
  id: z.string().min(1).max(120),
  brand: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  generation: z.string().max(60),
  body: z.enum(["coupe", "sedan", "hatch", "wagon", "suv", "roadster", "supercar", "pickup"]),
  yearFrom: z.number().int().min(1950).max(2035),
  yearTo: z.number().int().min(1950).max(2035).nullable(),
  variant: z.string().min(1).max(120),
  market: z.string().max(40).optional(),
  engine: z.object({
    code: z.string().max(40).optional(),
    family: z.string().max(60).optional(),
    name: z.string().max(120),
    displacementCc: optNum(400, 10000),
    cylinders: optNum(1, 16),
    layout: z.enum(["R", "V", "B", "W"]).optional(),
    compression: optNum(6, 25),
    induction: z.enum(["na", "turbo", "twin-turbo", "supercharger", "electric"]),
    turbos: optNum(0, 4),
    fuel: z.enum(["petrol", "diesel", "electric", "hydrogen"]),
    hybrid: z.enum(["none", "mhev", "hev", "phev"]),
    boostBar: optNum(0, 5),
    ecu: z.string().max(80).optional(),
    cooling: z.string().max(120).optional(),
    redline: optNum(3000, 20000),
    position: z.enum(["front", "mid", "rear"]).optional(),
  }),
  power: z.object({ ps: z.number().min(30).max(2500), kw: z.number().min(20).max(1900), rpmFrom: optNum(500, 20000), rpmTo: optNum(500, 20000) }),
  torque: z.object({ nm: z.number().min(40).max(3000), rpmFrom: optNum(0, 20000), rpmTo: optNum(0, 20000) }),
  performance: z.object({ vmax: optNum(80, 500), vmaxLimited: z.boolean().optional(), acc0100: optNum(1.5, 40), acc100200: optNum(2, 120) }),
  gearbox: z.object({
    type: z.enum(["manual", "automatic", "dct", "cvt", "single-speed"]),
    gears: z.number().int().min(1).max(10),
    name: z.string().max(80).optional(),
    ratios: z.array(z.number().min(0.3).max(8)).max(10).optional(),
    finalDrive: optNum(1.5, 7),
    tcu: z.string().max(80).optional(),
    torqueLimitNm: optNum(80, 3000),
  }),
  drive: z.enum(["FWD", "RWD", "AWD"]),
  weightKg: z.number().min(400).max(4500),
  weightBasis: z.enum(["DIN", "EU"]).optional(),
  aero: z.object({ cd: optNum(0.15, 0.7), areaM2: optNum(1.2, 4) }).optional(),
  tyres: z.object({ front: z.string().max(30), rear: z.string().max(30).optional() }).optional(),
  brakes: z.string().max(120).optional(),
  tankL: optNum(5, 200),
  consumption: z.object({ value: z.number().min(0.5).max(60), unit: z.enum(["l/100km", "kWh/100km", "kg/100km"]), cycle: z.enum(["WLTP", "NEFZ", "EPA"]) }).optional(),
  co2: optNum(0, 800),
  emission: z.string().max(40).optional(),
  ev: z
    .object({
      batteryGrossKwh: optNum(1, 250),
      batteryNetKwh: optNum(1, 250),
      voltage: optNum(40, 1000),
      motors: z.array(z.object({ position: z.enum(["front", "rear"]), kw: optNum(1, 1500) })).max(4).optional(),
      rangeKm: optNum(10, 1500),
      systemNote: z.string().max(300).optional(),
    })
    .optional(),
  notes: z.array(z.string().max(400)).max(12).optional(),
  custom: z.boolean().optional(),
});

export function parseVehicle(input: unknown): Vehicle {
  return vehicleSchema.parse(input) as Vehicle;
}
