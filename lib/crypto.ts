const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  if (password.length < 10) throw new Error("La contraseña debe tener al menos 10 caracteres.");
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, material, 256);
  return `pbkdf2_sha256$210000$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationsText, saltText, expectedText] = encoded.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !saltText || !expectedText) return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;
  const salt = fromBase64(saltText);
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256));
  const expected = fromBase64(expectedText);
  if (bits.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < bits.length; index += 1) mismatch |= bits[index] ^ expected[index];
  return mismatch === 0;
}

export async function hashToken(token: string) {
  return toBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token))));
}

export function createToken() {
  return toBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
