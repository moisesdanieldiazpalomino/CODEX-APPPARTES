import "server-only";

import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { createToken, hashToken, verifyPassword } from "@/lib/crypto";

const COOKIE_NAME = "climacontrol_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: "OFFICE" | "TECHNICIAN";
};

export async function createSession(userId: string) {
  const token = createToken();
  const id = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await getDb().insert(sessions).values({ id, userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "1",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.id, await hashToken(token)));
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await getDb()
    .select({ id: users.id, username: users.username, displayName: users.displayName, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, await hashToken(token)), gt(sessions.expiresAt, new Date().toISOString()), eq(users.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOffice() {
  const user = await requireUser();
  if (user.role !== "OFFICE") redirect("/dashboard");
  return user;
}

export async function authenticate(username: string, password: string) {
  const rows = await getDb().select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  const user = rows[0];
  if (!user?.active || !(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role } satisfies CurrentUser;
}
