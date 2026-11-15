import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "../db/client";

/**
 * Benutzerkonten: E-Mail + Passwort (scrypt), Sitzungen als zufällige Token,
 * von denen nur der SHA-256-Hash gespeichert wird. Das Modul ist bewusst
 * klein und gekapselt, damit es gegen Supabase Auth getauscht werden kann.
 */
const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "upl_session";
export const SESSION_DAYS = 30;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
}

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const normEmail = (e: string) => e.trim().toLowerCase();

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const key = await scrypt(pw, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

const pub = (u: typeof schema.users.$inferSelect): PublicUser => ({ id: u.id, email: u.email, name: u.name, settings: (u.settings ?? {}) as Record<string, unknown> });

export async function register(email: string, name: string, password: string): Promise<PublicUser> {
  const db = await getDb();
  const e = normEmail(email);
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, e)).limit(1);
  if (existing) throw new AuthError("Für diese E-Mail-Adresse existiert bereits ein Konto.", 409);
  const [user] = await db.insert(schema.users).values({ email: e, name: name.trim(), passwordHash: await hashPassword(password) }).returning();
  return pub(user);
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, normEmail(email))).limit(1);
  // gleiche Meldung für "unbekannt" und "falsches Passwort"
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new AuthError("E-Mail-Adresse oder Passwort ist falsch.", 401);
  return pub(user);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ tokenHash: sha(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function userFromToken(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, sha(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return row ? pub(row.user) : null;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha(token)));
}

export async function updateProfile(userId: string, patch: { name?: string; settings?: Record<string, unknown> }): Promise<PublicUser> {
  const db = await getDb();
  const [user] = await db
    .update(schema.users)
    .set({ ...(patch.name ? { name: patch.name.trim() } : {}), ...(patch.settings ? { settings: patch.settings } : {}) })
    .where(eq(schema.users.id, userId))
    .returning();
  if (!user) throw new AuthError("Konto nicht gefunden.", 404);
  return pub(user);
}

/** Liefert ein Reset-Token, falls das Konto existiert – sonst null (kein Hinweis nach außen). */
export async function requestPasswordReset(email: string): Promise<{ token: string; email: string } | null> {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, normEmail(email))).limit(1);
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await db.insert(schema.passwordResets).values({ tokenHash: sha(token), userId: user.id, expiresAt: new Date(Date.now() + 3600_000) });
  return { token, email: user.email };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.tokenHash, sha(token)), gt(schema.passwordResets.expiresAt, new Date()), isNull(schema.passwordResets.usedAt)))
    .limit(1);
  if (!row) throw new AuthError("Der Link ist ungültig oder abgelaufen.", 400);
  await db.update(schema.users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(schema.users.id, row.userId));
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.tokenHash, row.tokenHash));
  // alle bestehenden Sitzungen beenden
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, row.userId));
}
