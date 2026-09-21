import { Calculator } from "@/components/calculator";

export default function CalculatorPage() {
  return (
    <main className="app-main">
      <h1 className="page-title">Calculadora</h1>
      <p className="page-subtitle">Haz cálculos rápidos sin salir de la aplicación.</p>
      <Calculator />
    </main>
  );
}
