"use client";

import { useCallback, useReducer } from "react";
import {
  calculatorReducer,
  initialCalculatorState,
  type CalculatorState,
  type Operator,
} from "./calculatorReducer";

export interface UseCalculatorResult extends CalculatorState {
  inputDigit: (digit: string | number) => void;
  inputDecimal: () => void;
  selectOperator: (operator: Operator) => void;
  calculate: () => void;
  clear: () => void;
}

export function useCalculator(): UseCalculatorResult {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  const inputDigit = useCallback((digit: string | number) => {
    dispatch({ type: "inputDigit", digit });
  }, []);

  const inputDecimal = useCallback(() => {
    dispatch({ type: "inputDecimal" });
  }, []);

  const selectOperator = useCallback((operator: Operator) => {
    dispatch({ type: "selectOperator", operator });
  }, []);

  const calculate = useCallback(() => {
    dispatch({ type: "calculate" });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  return {
    ...state,
    inputDigit,
    inputDecimal,
    selectOperator,
    calculate,
    clear,
  };
}

export default useCalculator;
