import { describe, expect, it } from "vitest";
import { calculate, formatCalculatorValue, parseCalculatorNumber } from "@/lib/calculator";

describe("parseCalculatorNumber", () => {
  it("acepta coma, punto, signos y espacios exteriores", () => {
    expect(parseCalculatorNumber(" -12,5 ")).toBe(-12.5);
    expect(parseCalculatorNumber("+.75")).toBe(0.75);
    expect(parseCalculatorNumber("3.")).toBe(3);
  });

  it("rechaza valores vacíos, letras y separadores de miles", () => {
    expect(parseCalculatorNumber("")).toBeNull();
    expect(parseCalculatorNumber("abc")).toBeNull();
    expect(parseCalculatorNumber("1.000,5")).toBeNull();
  });

  it("rechaza valores fuera del rango numérico finito", () => {
    expect(parseCalculatorNumber("9".repeat(400))).toBeNull();
  });
});

describe("calculate", () => {
  it("resuelve suma y resta con decimales y números negativos", () => {
    expect(calculate("add", "12,5", "0.5")).toEqual({ value: 13 });
    expect(calculate("subtract", "-2", "3")).toEqual({ value: -5 });
  });

  it("resuelve multiplicación y división", () => {
    expect(calculate("multiply", "7", "6")).toEqual({ value: 42 });
    expect(calculate("divide", "7", "2")).toEqual({ value: 3.5 });
  });

  it("resuelve potencias y raíces cuadradas", () => {
    expect(calculate("power", "2", "-3")).toEqual({ value: 0.125 });
    expect(calculate("squareRoot", "81", "valor ignorado")).toEqual({ value: 9 });
    expect(calculate("squareRoot", "-0", "")).toEqual({ value: 0 });
  });

  it("explica entradas incompletas o incorrectas", () => {
    expect(calculate("add", "", "2")).toEqual({ error: "Introduce un primer número válido." });
    expect(calculate("add", "2", "abc")).toEqual({ error: "Introduce un segundo número válido." });
    expect(calculate("squareRoot", "", "")).toEqual({ error: "Introduce un número válido." });
  });

  it("rechaza divisiones por cero y operaciones indefinidas", () => {
    expect(calculate("divide", "5", "0")).toEqual({ error: "No se puede dividir entre cero." });
    expect(calculate("power", "0", "0")).toEqual({ error: "Cero elevado a cero no está definido." });
    expect(calculate("squareRoot", "-9", "")).toEqual({ error: "La raíz cuadrada de un número negativo no es real." });
  });

  it("rechaza resultados no reales o desbordados", () => {
    expect(calculate("power", "-2", "0,5")).toEqual({ error: "El resultado no es real o es demasiado grande." });
    expect(calculate("power", "999999999999999999999", "999")).toEqual({ error: "El resultado no es real o es demasiado grande." });
  });
});

describe("formatCalculatorValue", () => {
  it("presenta resultados habituales con coma decimal", () => {
    expect(formatCalculatorValue(12.5)).toBe("12,5");
  });

  it("conserva el cero como resultado legible", () => {
    expect(formatCalculatorValue(0)).toBe("0");
    expect(formatCalculatorValue(-0)).toBe("0");
  });

  it("usa notación exponencial para magnitudes extremas", () => {
    expect(formatCalculatorValue(1e-8)).toContain("e-8");
    expect(formatCalculatorValue(1e12)).toContain("e+12");
  });
});
