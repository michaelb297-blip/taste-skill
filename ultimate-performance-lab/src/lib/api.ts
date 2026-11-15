import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, SESSION_COOKIE, userFromToken, type PublicUser } from "./auth";
import { getVehicle } from "./data/catalog";
import type { Vehicle } from "./types";
import { parseVehicle } from "./vehicle-schema";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Einheitliche Fehlerbehandlung für Route-Handler. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    if (err instanceof ZodError) return fail(`Ungültige Eingabe: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).slice(0, 4).join("; ")}`, 422);
    if (err instanceof SyntaxError) return fail("Ungültiges JSON.", 400);
    console.error("[api]", err);
    return fail("Interner Fehler.", 500);
  }
}

export async function currentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<PublicUser> {
  const u = await currentUser();
  if (!u) throw new AuthError("Bitte anmelden.", 401);
  return u;
}

/** Fahrzeug aus Katalog-ID oder mitgeliefertem (validiertem) Nutzerdatensatz. */
export function resolveVehicle(body: { vehicleId?: unknown; vehicle?: unknown }): Vehicle | null {
  if (typeof body.vehicleId === "string") return getVehicle(body.vehicleId) ?? null;
  if (body.vehicle) return { ...parseVehicle(body.vehicle), custom: true };
  return null;
}
