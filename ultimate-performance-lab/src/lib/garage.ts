import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./db/client";

export type GarageKind = "fahrzeug" | "simulation" | "konfiguration" | "vergleich";

export interface GarageItem {
  id: string;
  kind: GarageKind;
  title: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const MAX_ITEMS = 200;

export async function listGarage(userId: string): Promise<GarageItem[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.garageItems).where(eq(schema.garageItems.userId, userId)).orderBy(desc(schema.garageItems.createdAt)).limit(MAX_ITEMS);
  return rows.map((r) => ({ id: r.id, kind: r.kind as GarageKind, title: r.title, payload: r.payload, createdAt: new Date(r.createdAt).toISOString() }));
}

export async function addGarageItem(userId: string, item: { kind: GarageKind; title: string; payload: Record<string, unknown> }): Promise<GarageItem> {
  const db = await getDb();
  const [r] = await db.insert(schema.garageItems).values({ userId, kind: item.kind, title: item.title, payload: item.payload }).returning();
  return { id: r.id, kind: r.kind as GarageKind, title: r.title, payload: r.payload, createdAt: new Date(r.createdAt).toISOString() };
}

export async function removeGarageItem(userId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.delete(schema.garageItems).where(and(eq(schema.garageItems.id, id), eq(schema.garageItems.userId, userId))).returning();
  return rows.length > 0;
}
