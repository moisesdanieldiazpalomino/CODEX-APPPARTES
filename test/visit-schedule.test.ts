import { describe, expect, it } from "vitest";
import { visitScheduleError } from "@/lib/domain";

describe("visitScheduleError", () => {
  it("acepta fecha y franja completas para una visita asignada", () => {
    expect(visitScheduleError("2026-09-21", "MORNING", true)).toBeNull();
    expect(visitScheduleError("2026-09-21", "AFTERNOON", true)).toBeNull();
  });

  it("exige ambos datos al asignar o iniciar una visita", () => {
    expect(visitScheduleError(null, "MORNING", true)).toContain("fecha y franja");
    expect(visitScheduleError("2026-09-21", null, true)).toContain("fecha y franja");
  });

  it("permite registrar trabajos aún sin asignar", () => {
    expect(visitScheduleError(null, null, false)).toBeNull();
  });

  it("rechaza fechas con formato o día inexistente", () => {
    expect(visitScheduleError("21/09/2026", "MORNING", true)).toBe("La fecha no es válida.");
    expect(visitScheduleError("2026-02-30", "MORNING", true)).toBe("La fecha no es válida.");
  });

  it("rechaza una franja desconocida", () => {
    expect(visitScheduleError("2026-09-21", "NIGHT", true)).toBe("La franja no es válida.");
  });
});
