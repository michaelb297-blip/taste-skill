import { eq } from "drizzle-orm";
import { getDb, schema } from "./client";

/** Recherche-Cache. Fällt die Datenbank aus, arbeitet die Recherche ohne Cache weiter. */
export async function cacheGet<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(schema.researchCache).where(eq(schema.researchCache.key, key)).limit(1);
    if (!row || Date.now() - new Date(row.fetchedAt).getTime() > ttlMs) return null;
    return row.payload as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, payload: unknown): Promise<void> {
  try {
    const db = await getDb();
    await db
      .insert(schema.researchCache)
      .values({ key, payload, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: schema.researchCache.key, set: { payload, fetchedAt: new Date() } });
  } catch {
    /* Cache ist optional */
  }
}
