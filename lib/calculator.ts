export type CalculatorOperation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "power"
  | "squareRoot";

export type CalculationResult =
  | { value: number; error?: never }
  | { error: string; value?: never };

export function parseCalculatorNumber(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function calculate(
  operation: CalculatorOperation,
  firstInput: string,
  secondInput: string,
): CalculationResult {
  const first = parseCalculatorNumber(firstInput);
  if (first === null) {
    return { error: operation === "squareRoot"
      ? "Introduce un número válido."
      : "Introduce un primer número válido." };
  }

  if (operation === "squareRoot") {
    if (first < 0) return { error: "La raíz cuadrada de un número negativo no es real." };
    return { value: first === 0 ? 0 : Math.sqrt(first) };
  }

  const second = parseCalculatorNumber(secondInput);
  if (second === null) return { error: "Introduce un segundo número válido." };

  if (operation === "divide" && second === 0) {
    return { error: "No se puede dividir entre cero." };
  }
  if (operation === "power" && first === 0 && second === 0) {
    return { error: "Cero elevado a cero no está definido." };
  }

  let value: number;
  switch (operation) {
    case "add": value = first + second; break;
    case "subtract": value = first - second; break;
    case "multiply": value = first * second; break;
    case "divide": value = first / second; break;
    case "power": value = first ** second; break;
    default: return { error: "La operación no es válida." };
  }

  if (!Number.isFinite(value)) {
    return { error: "El resultado no es real o es demasiado grande." };
  }
  return { value: Object.is(value, -0) ? 0 : value };
}

export function formatCalculatorValue(value: number): string {
  if (Object.is(value, -0)) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e12 || (magnitude > 0 && magnitude < 1e-6)) {
    return value.toExponential(6).replace(".", ",");
  }
  return new Intl.NumberFormat("es-ES", { maximumSignificantDigits: 12 }).format(value);
}
