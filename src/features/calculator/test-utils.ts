import {
  calculatorReducer,
  initialCalculatorState,
} from './engine';
import type { CalculatorAction, CalculatorState, Digit } from './types';

export function reduceCalculatorActions(
  actions: readonly CalculatorAction[],
  seed: CalculatorState = initialCalculatorState,
): CalculatorState {
  return actions.reduce(calculatorReducer, seed);
}

export function enterDigits(value: string): CalculatorAction[] {
  return value.split('').map((character) => {
    if (!isDigit(character)) {
      throw new Error(`Cannot create digit action for non-digit character: ${character}`);
    }

    return { type: 'digit', digit: character };
  });
}

export function digit(digitValue: Digit): CalculatorAction {
  return { type: 'digit', digit: digitValue };
}

function isDigit(value: string): value is Digit {
  return /^[0-9]$/.test(value);
}
