import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ total }] = await getDb().select({ total: count() }).from(users);
  if (total === 0) redirect("/setup");
  redirect((await getCurrentUser()) ? "/dashboard" : "/login");
}
