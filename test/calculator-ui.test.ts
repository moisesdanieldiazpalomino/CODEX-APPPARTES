import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CalculatorPage from "@/app/(app)/calculadora/page";

describe("CalculatorPage y Calculator", () => {
  it("muestra las seis operaciones solicitadas en la página protegida", () => {
    const html = renderToStaticMarkup(createElement(CalculatorPage));
    for (const label of ["Suma", "Resta", "Multiplicación", "División", "Potencia", "Raíz cuadrada"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("<h1");
    expect(html).toContain("Calculadora");
  });

  it("ofrece campos decimales accesibles y un control único seleccionado", () => {
    const html = renderToStaticMarkup(createElement(CalculatorPage));
    expect(html).toContain('id="calculator-first"');
    expect(html).toContain('id="calculator-second"');
    expect(html).toContain('inputMode="decimal"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it("muestra acciones claras y un área de resultado anunciable", () => {
    const html = renderToStaticMarkup(createElement(CalculatorPage));
    expect(html).toContain("Calcular");
    expect(html).toContain("Limpiar");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Introduce los valores");
  });
});
