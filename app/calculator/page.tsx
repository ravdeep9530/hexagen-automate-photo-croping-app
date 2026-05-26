import type { Metadata } from "next";

import Calculator from "@/features/calculator/Calculator";

export const metadata: Metadata = {
  title: "Calculator",
  description: "Use the Material UI calculator.",
};

export default function CalculatorPage() {
  return (
    <main aria-labelledby="calculator-page-title">
      <h1 id="calculator-page-title">Calculator</h1>
      <Calculator />
    </main>
  );
}
