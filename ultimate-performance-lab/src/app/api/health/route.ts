import { ok } from "@/lib/api";
import { dbMode, getDb } from "@/lib/db/client";
import { PROVIDERS } from "@/lib/research/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "ok";
  try {
    await getDb();
  } catch (e) {
    db = `Fehler: ${e instanceof Error ? e.message : "unbekannt"}`;
  }
  return ok({
    database: { mode: dbMode(), status: db },
    providers: PROVIDERS.map((p) => ({ id: p.id, label: p.label, type: p.type, configured: p.isConfigured(), envVar: p.envVar })),
    mail: { configured: !!process.env.RESEND_API_KEY },
  });
}
