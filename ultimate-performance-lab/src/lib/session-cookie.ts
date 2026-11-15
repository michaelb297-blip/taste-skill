import { cookies } from "next/headers";
import { createSession, SESSION_COOKIE } from "./auth";

export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}
