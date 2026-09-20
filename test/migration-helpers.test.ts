import { describe, expect, it } from "vitest";
import { bucketForObjectKey, normalizeLegacyTimestamp } from "../scripts/migration-helpers.mjs";

describe("normalizeLegacyTimestamp", () => {
  it("interpreta las marcas SQLite con espacio como UTC", () => {
    expect(normalizeLegacyTimestamp("2026-09-19 21:53:58")).toBe("2026-09-19T21:53:58Z");
  });

  it("interpreta las horas del formulario local en Lima", () => {
    expect(normalizeLegacyTimestamp("2026-09-19T16:52")).toBe("2026-09-19T16:52-05:00");
  });

  it("conserva marcas con zona explícita", () => {
    expect(normalizeLegacyTimestamp("2026-09-19T22:56:13.806Z")).toBe("2026-09-19T22:56:13.806Z");
    expect(normalizeLegacyTimestamp("2026-09-19T16:52-05:00")).toBe("2026-09-19T16:52-05:00");
  });

  it("mantiene nulos sin inventar fechas", () => {
    expect(normalizeLegacyTimestamp(null)).toBeNull();
  });
});

describe("bucketForObjectKey", () => {
  it("manda PDF al bucket de documentos", () => {
    expect(bucketForObjectKey("documents/orden/parte.pdf")).toBe("partes-documentos");
  });

  it("manda fotos al bucket de imágenes", () => {
    expect(bucketForObjectKey("visits/visita/foto.png")).toBe("partes-imagenes");
  });

  it("manda firmas al bucket de imágenes", () => {
    expect(bucketForObjectKey("signatures/visita/firma.png")).toBe("partes-imagenes");
  });
});
