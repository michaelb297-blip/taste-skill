import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { resetPassword } from "@/lib/auth";

const body = z.object({ token: z.string().min(10).max(200), password: z.string().min(10, "Das Passwort braucht mindestens 10 Zeichen.").max(200) });

export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    await resetPassword(b.token, b.password);
    return ok({ ok: true });
  });
}
