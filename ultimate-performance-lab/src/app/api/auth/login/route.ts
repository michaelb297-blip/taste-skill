import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { login } from "@/lib/auth";
import { startSession } from "@/lib/session-cookie";

const body = z.object({ email: z.string().max(200), password: z.string().max(200) });

export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    const user = await login(b.email, b.password);
    await startSession(user.id);
    return ok({ user });
  });
}
