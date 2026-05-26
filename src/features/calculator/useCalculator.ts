'use client';

import { useReducer } from 'react';

import {
  calculatorReducer,
  initialCalculatorState,
  type CalculatorAction,
  type CalculatorState,
} from './calculatorReducer';

export interface UseCalculatorResult {
  state: CalculatorState;
  dispatch: React.Dispatch<CalculatorAction>;
}

export function useCalculator(): UseCalculatorResult {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  return { state, dispatch };
}
