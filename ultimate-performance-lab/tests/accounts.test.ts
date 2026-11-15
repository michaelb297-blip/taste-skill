import { describe, expect, it } from "vitest";
process.env.PGLITE_DIR = "memory";
import { AuthError, createSession, destroySession, hashPassword, login, register, requestPasswordReset, resetPassword, updateProfile, userFromToken, verifyPassword } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/db/cache";
import { addGarageItem, listGarage, removeGarageItem } from "@/lib/garage";

describe("Benutzerkonten", () => {
  it("speichert Passwörter nur als scrypt-Hash", async () => {
    const h = await hashPassword("geheim-geheim-1");
    expect(h).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(h).not.toContain("geheim");
    expect(await verifyPassword("geheim-geheim-1", h)).toBe(true);
    expect(await verifyPassword("falsch", h)).toBe(false);
    expect(await verifyPassword("x", "kaputt")).toBe(false);
  });

  it("registriert, meldet an und verwaltet Sitzungen", async () => {
    const u = await register("  Fahrer@Example.com ", "Test Fahrer", "sehr-langes-passwort");
    expect(u.email).toBe("fahrer@example.com");
    await expect(register("fahrer@example.com", "Zweiter", "sehr-langes-passwort")).rejects.toMatchObject({ status: 409 });
    await expect(login("fahrer@example.com", "falsch")).rejects.toBeInstanceOf(AuthError);
    await expect(login("niemand@example.com", "egal")).rejects.toMatchObject({ status: 401 });
    const me = await login("FAHRER@example.com", "sehr-langes-passwort");
    const { token } = await createSession(me.id);
    expect((await userFromToken(token))?.id).toBe(me.id);
    expect(await userFromToken("erfunden")).toBeNull();
    expect(await userFromToken(undefined)).toBeNull();
    await destroySession(token);
    expect(await userFromToken(token)).toBeNull();
  });

  it("setzt Passwörter über Einmal-Token zurück und beendet Sitzungen", async () => {
    const u = await register("reset@example.com", "Reset", "altes-passwort-123");
    const { token: session } = await createSession(u.id);
    expect(await requestPasswordReset("unbekannt@example.com")).toBeNull();
    const r = await requestPasswordReset("reset@example.com");
    await resetPassword(r!.token, "neues-passwort-456");
    await expect(login("reset@example.com", "altes-passwort-123")).rejects.toBeInstanceOf(AuthError);
    expect((await login("reset@example.com", "neues-passwort-456")).id).toBe(u.id);
    expect(await userFromToken(session)).toBeNull();
    await expect(resetPassword(r!.token, "noch-ein-passwort-789")).rejects.toThrow(/ungültig oder abgelaufen/);
  });

  it("speichert Profil und Einstellungen", async () => {
    const u = await register("profil@example.com", "Alt", "sehr-langes-passwort");
    const p = await updateProfile(u.id, { name: "Neu", settings: { units: "kw", sound: true } });
    expect(p).toMatchObject({ name: "Neu", settings: { units: "kw", sound: true } });
  });
});

describe("Meine Garage (Datenbankzugriffe)", () => {
  it("trennt Einträge je Nutzer und löscht nur eigene", async () => {
    const a = await register("a@example.com", "A A", "sehr-langes-passwort");
    const b = await register("b@example.com", "B B", "sehr-langes-passwort");
    const item = await addGarageItem(a.id, { kind: "simulation", title: "430i Stage 2", payload: { vehicleId: "bmw-4er-g22-430i-245-rwd", stage: "stage2", profile: "daily" } });
    await addGarageItem(a.id, { kind: "fahrzeug", title: "Golf R", payload: { vehicleId: "vw-golf-8-r" } });
    expect(await listGarage(a.id)).toHaveLength(2);
    expect(await listGarage(b.id)).toHaveLength(0);
    expect((await listGarage(a.id)).find((i) => i.id === item.id)!.payload).toMatchObject({ stage: "stage2" });
    expect(await removeGarageItem(b.id, item.id)).toBe(false);
    expect(await removeGarageItem(a.id, item.id)).toBe(true);
    expect(await listGarage(a.id)).toHaveLength(1);
  });
});

describe("Recherche-Cache", () => {
  it("liefert frische Einträge und verwirft abgelaufene", async () => {
    await cacheSet("k1", { a: 1 });
    expect(await cacheGet("k1", 60_000)).toEqual({ a: 1 });
    expect(await cacheGet("k1", -1)).toBeNull();
    expect(await cacheGet("fehlt", 60_000)).toBeNull();
    await cacheSet("k1", { a: 2 });
    expect(await cacheGet("k1", 60_000)).toEqual({ a: 2 });
  });
});
