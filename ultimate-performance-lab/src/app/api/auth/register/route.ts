import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { register } from "@/lib/auth";
import { startSession } from "@/lib/session-cookie";

const body = z.object({
  email: z.email("Bitte eine gültige E-Mail-Adresse angeben.").max(200),
  name: z.string().trim().min(2, "Name ist zu kurz.").max(80),
  password: z.string().min(10, "Das Passwort braucht mindestens 10 Zeichen.").max(200),
});

export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    const user = await register(b.email, b.name, b.password);
    await startSession(user.id);
    return ok({ user }, { status: 201 });
  });
}
