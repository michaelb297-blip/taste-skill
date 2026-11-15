import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * Datenbankzugriff über Drizzle ORM.
 *  - DATABASE_URL gesetzt  -> PostgreSQL / Supabase (node-postgres)
 *  - sonst                 -> eingebettetes Postgres (PGlite) unter ./.data
 * Beide Treiber sprechen denselben SQL-Dialekt; das Schema ist identisch.
 */
export type Db = PgliteDatabase<typeof schema>;

type Holder = { db?: Promise<Db> };
const holder = globalThis as unknown as { __uplDb?: Holder };
holder.__uplDb ??= {};

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 5, ssl: /supabase|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
    await pool.query(schema.BOOTSTRAP_SQL);
    return drizzle(pool, { schema }) as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dir = process.env.PGLITE_DIR;
  let client;
  if (dir === "memory") client = new PGlite();
  else {
    const path = await import("node:path");
    const fs = await import("node:fs");
    const target = dir || path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(target, { recursive: true });
    client = new PGlite(target);
  }
  await client.exec(schema.BOOTSTRAP_SQL);
  return drizzle(client, { schema });
}

export function getDb(): Promise<Db> {
  const h = holder.__uplDb!;
  h.db ??= connect().catch((err) => {
    h.db = undefined;
    throw err;
  });
  return h.db;
}

export function dbMode(): "postgres" | "pglite" {
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

export { schema };
