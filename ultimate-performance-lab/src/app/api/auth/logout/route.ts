import { cookies } from "next/headers";
import { handle, ok } from "@/lib/api";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  return handle(async () => {
    const jar = await cookies();
    await destroySession(jar.get(SESSION_COOKIE)?.value);
    jar.delete(SESSION_COOKIE);
    return ok({ ok: true });
  });
}
