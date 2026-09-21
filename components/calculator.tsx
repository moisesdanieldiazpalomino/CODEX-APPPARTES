"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculate,
  formatCalculatorValue,
  type CalculationResult,
  type CalculatorOperation,
} from "@/lib/calculator";

const operations: ReadonlyArray<{ id: CalculatorOperation; label: string; symbol: string }> = [
  { id: "add", label: "Suma", symbol: "+" },
  { id: "subtract", label: "Resta", symbol: "−" },
  { id: "multiply", label: "Multiplicación", symbol: "×" },
  { id: "divide", label: "División", symbol: "÷" },
  { id: "power", label: "Potencia", symbol: "xʸ" },
  { id: "squareRoot", label: "Raíz cuadrada", symbol: "√x" },
];

export function Calculator() {
  const [operation, setOperation] = useState<CalculatorOperation>("add");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const needsSecond = operation !== "squareRoot";
  const symbol = operations.find((item) => item.id === operation)?.symbol ?? "+";
  const expression = needsSecond ? first + " " + symbol + " " + second : "√(" + first + ")";

  function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(calculate(operation, first, second));
  }

  function clear() {
    setFirst("");
    setSecond("");
    setOperation("add");
    setResult(null);
  }

  return (
    <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <form onSubmit={handleCalculate} noValidate className="surface-panel space-y-6 p-5 sm:p-7">
        <fieldset>
          <legend className="font-display text-lg font-bold text-[#12333d]">Operación</legend>
          <p className="mt-1 text-sm text-[#58717a]">Selecciona el cálculo que necesitas.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {operations.map((item) => {
              const selected = operation === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => { setOperation(item.id); setResult(null); }}
                  className={`flex min-h-20 flex-col items-start justify-between rounded-xl border px-4 py-3 text-left transition-colors ${selected ? "border-[#087f86] bg-[#e6f4f3] text-[#075f65]" : "border-[#d2e2e2] bg-white text-[#45636b] hover:border-[#87adb1] hover:bg-[#f1f6f5]"}`}
                >
                  <span className="font-display text-2xl font-bold leading-none" aria-hidden="true">{item.symbol}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calculator-first">{operation === "squareRoot" ? "Número" : operation === "power" ? "Base" : "Primer número"}</Label>
            <Input
              id="calculator-first"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={first}
              onChange={(event) => { setFirst(event.target.value); setResult(null); }}
              placeholder="Ej. 12,5"
              className="h-12 text-lg md:text-lg"
            />
          </div>
          {needsSecond && (
            <div className="space-y-2">
              <Label htmlFor="calculator-second">{operation === "power" ? "Exponente" : "Segundo número"}</Label>
              <Input
                id="calculator-second"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={second}
                onChange={(event) => { setSecond(event.target.value); setResult(null); }}
                placeholder="Ej. 3"
                className="h-12 text-lg md:text-lg"
              />
            </div>
          )}
        </div>
        <p className="text-sm text-[#58717a]">Puedes usar coma o punto para los decimales. No uses separadores de miles.</p>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" className="h-12 min-w-36 font-semibold">
            Calcular <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={clear} className="h-12 border-[#c8dada]">
            <RotateCcw className="size-4" aria-hidden="true" /> Limpiar
          </Button>
        </div>
      </form>

      <section aria-label="Resultado de la calculadora" className="min-h-[240px] rounded-[1rem] bg-[#12333d] p-6 text-white sm:p-8">
        <p className="text-sm font-semibold text-[#9de0dc]">Resultado</p>
        <div aria-live="polite" aria-atomic="true" className="mt-6 min-h-24">
          {result?.error ? (
            <p role="alert" className="rounded-lg bg-[#fff4f1] p-4 text-sm font-semibold text-[#b64236]">{result.error}</p>
          ) : result?.value !== undefined ? (
            <output className="font-display block break-all text-[clamp(2.25rem,4vw,4rem)] font-bold leading-tight tracking-[-0.04em] tabular-nums">
              {formatCalculatorValue(result.value)}
            </output>
          ) : (
            <p className="text-base leading-relaxed text-[#c7dedf]">Introduce los valores y pulsa «Calcular» para ver el resultado.</p>
          )}
        </div>
        {result?.value !== undefined && <p className="mt-5 break-words border-t border-white/15 pt-4 text-sm text-[#c7dedf]">{expression}</p>}
      </section>
    </div>
  );
}
