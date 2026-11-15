import { ok } from "@/lib/api";
import { selectionOptions, type Selection } from "@/lib/data/catalog";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sel: Selection = {
    brand: p.get("brand") || undefined,
    model: p.get("model") || undefined,
    generation: p.get("generation") || undefined,
    year: p.get("year") ? Number(p.get("year")) : undefined,
    variant: p.get("variant") || undefined,
    gearbox: p.get("gearbox") || undefined,
    drive: p.get("drive") || undefined,
  };
  const r = selectionOptions(sel);
  return ok({ step: r.step, options: r.options, matches: r.matches.map((v) => v.id), count: r.matches.length });
}
