import "server-only";

import { createClient } from "@supabase/supabase-js";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function storage() {
  const url = process.env.SUPABASE_URL ?? "https://hyhgxnwjnyxinzjhaywa.supabase.co";
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY en .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

function bucketName(key: string) {
  return key.startsWith("documents/") ? "partes-documentos" : "partes-imagenes";
}

export function validateImage(file: File) {
  if (!IMAGE_TYPES.has(file.type)) throw new Error("La imagen debe ser JPG, PNG o WebP.");
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error("La imagen no puede superar 8 MB.");
}

export async function storeFile(key: string, bytes: ArrayBuffer | Uint8Array, contentType: string) {
  const { error } = await storage().from(bucketName(key)).upload(key, bytes, { contentType, upsert: false });
  if (error) throw new Error(`No se pudo guardar el archivo: ${error.message}`);
  return key;
}

export async function storeImage(file: File, prefix: string) {
  validateImage(file);
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;
  await storeFile(key, await file.arrayBuffer(), file.type);
  return key;
}

export async function storeSignature(dataUrl: string, visitId: string) {
  const prefix = "data:image/png;base64,";
  if (!dataUrl.startsWith(prefix)) throw new Error("La firma no tiene un formato válido.");
  const raw = atob(dataUrl.slice(prefix.length));
  if (raw.length < 100 || raw.length > 2 * 1024 * 1024) throw new Error("La firma no tiene un tamaño válido.");
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  const key = `signatures/${visitId}/${crypto.randomUUID()}.png`;
  await storeFile(key, bytes, "image/png");
  return { key, bytes };
}

export async function getStoredFile(key: string) {
  const { data, error } = await storage().from(bucketName(key)).download(key);
  if (error) return null;
  return data;
}

export async function deleteStoredFile(key: string) {
  const { error } = await storage().from(bucketName(key)).remove([key]);
  if (error) throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
}
