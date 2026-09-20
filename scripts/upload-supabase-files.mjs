import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { bucketForObjectKey } from "./migration-helpers.mjs";

const backup = process.argv[2];
if (!backup) throw new Error("Indica la carpeta del respaldo local.");
const secret = process.env.SUPABASE_SECRET_KEY;
if (!secret) throw new Error("Falta SUPABASE_SECRET_KEY en .env.local.");
const url = process.env.SUPABASE_URL ?? "https://hyhgxnwjnyxinzjhaywa.supabase.co";
const snapshot = JSON.parse(execFileSync(process.execPath, ["--no-warnings", "scripts/export-local-for-supabase.mjs", backup], { encoding: "utf8" }));
const storage = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }).storage;

for (const object of snapshot.objects) {
  const bucket = bucketForObjectKey(object.key);
  const bytes = readFileSync(object.path);
  const { error } = await storage.from(bucket).upload(object.key, bytes, { contentType: object.contentType, upsert: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`${object.key}: ${error.message}`);
  const downloaded = await storage.from(bucket).download(object.key);
  if (downloaded.error || !downloaded.data) throw new Error(`${object.key}: no se pudo verificar la descarga.`);
  const digest = createHash("sha256").update(Buffer.from(await downloaded.data.arrayBuffer())).digest("hex");
  if (digest !== object.sha256) throw new Error(`${object.key}: comprobación SHA-256 fallida.`);
  console.log(`Verificado: ${object.key}`);
}

console.log(`${snapshot.objects.length} archivos migrados y verificados.`);
