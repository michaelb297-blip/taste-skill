import { z } from "zod";
import { fail, handle, ok, requireUser } from "@/lib/api";
import { addGarageItem, listGarage, removeGarageItem } from "@/lib/garage";

export const dynamic = "force-dynamic";

const item = z.object({
  kind: z.enum(["fahrzeug", "simulation", "konfiguration", "vergleich"]),
  title: z.string().trim().min(1).max(160),
  payload: z.record(z.string(), z.unknown()).refine((p) => JSON.stringify(p).length < 60_000, "Eintrag ist zu groß."),
});

export async function GET() {
  return handle(async () => ok({ items: await listGarage((await requireUser()).id) }));
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const raw = await req.json();
    // Übernahme der Gast-Garage: mehrere Einträge in einem Aufruf
    const list = z.array(item).max(100).parse(Array.isArray(raw) ? raw : [raw]);
    const saved = [];
    for (const i of list) saved.push(await addGarageItem(user.id, i));
    return ok({ items: saved }, { status: 201 });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id || !z.uuid().safeParse(id).success) return fail("Ungültige ID.", 400);
    return (await removeGarageItem(user.id, id)) ? ok({ ok: true }) : fail("Eintrag nicht gefunden.", 404);
  });
}
