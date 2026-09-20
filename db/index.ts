import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en .env.local.");
  const client = postgres(url, { max: 5, prepare: false, ssl: "require" });
  return drizzle(client, { schema });
}

let database: ReturnType<typeof connect> | undefined;

export function getDb() {
  database ??= connect();
  return database;
}
