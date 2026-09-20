import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/crypto";

describe("verifyPassword", () => {
  it("acepta la contraseña correspondiente al hash migrado", async () => {
    const hash = await hashPassword("Tecnico2026!", new Uint8Array(16).fill(1));
    expect(await verifyPassword("Tecnico2026!", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta con el mismo usuario", async () => {
    const hash = await hashPassword("Tecnico2026!", new Uint8Array(16).fill(2));
    expect(await verifyPassword("OtraClave2026!", hash)).toBe(false);
  });

  it("rechaza hashes incompletos o de otro algoritmo", async () => {
    expect(await verifyPassword("Tecnico2026!", "pbkdf2_sha256$210000$sin-firma")).toBe(false);
    expect(await verifyPassword("Tecnico2026!", "bcrypt$12$algo")).toBe(false);
  });
});
