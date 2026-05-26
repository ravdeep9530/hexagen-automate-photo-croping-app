import type { CalculationResult, Operator } from './types';
import {
  ERROR_DISPLAY,
  INVALID_NUMBER_ERROR,
  formatCalculationResult,
  isFiniteNumber,
} from './calculatorFormat';

export const CALCULATOR_ERRORS = {
  DIVIDE_BY_ZERO: 'Cannot divide by zero',
  INVALID_NUMBER: INVALID_NUMBER_ERROR,
} as const;

export function createCalculationError(error: string): CalculationResult {
  return {
    value: null,
    display: ERROR_DISPLAY,
    error,
  };
}

function validateOperands(leftOperand: number, rightOperand: number): CalculationResult | null {
  if (!isFiniteNumber(leftOperand) || !isFiniteNumber(rightOperand)) {
    return createCalculationError(CALCULATOR_ERRORS.INVALID_NUMBER);
  }

  return null;
}

export function add(leftOperand: number, rightOperand: number): CalculationResult {
  const invalidResult = validateOperands(leftOperand, rightOperand);
  if (invalidResult) {
    return invalidResult;
  }

  return formatCalculationResult(leftOperand + rightOperand);
}

export function subtract(leftOperand: number, rightOperand: number): CalculationResult {
  const invalidResult = validateOperands(leftOperand, rightOperand);
  if (invalidResult) {
    return invalidResult;
  }

  return formatCalculationResult(leftOperand - rightOperand);
}

export function multiply(leftOperand: number, rightOperand: number): CalculationResult {
  const invalidResult = validateOperands(leftOperand, rightOperand);
  if (invalidResult) {
    return invalidResult;
  }

  return formatCalculationResult(leftOperand * rightOperand);
}

export function divide(leftOperand: number, rightOperand: number): CalculationResult {
  const invalidResult = validateOperands(leftOperand, rightOperand);
  if (invalidResult) {
    return invalidResult;
  }

  if (rightOperand === 0) {
    return createCalculationError(CALCULATOR_ERRORS.DIVIDE_BY_ZERO);
  }

  return formatCalculationResult(leftOperand / rightOperand);
}

export function compute(operator: Operator, leftOperand: number, rightOperand: number): CalculationResult {
  switch (operator) {
    case 'add':
      return add(leftOperand, rightOperand);
    case 'subtract':
      return subtract(leftOperand, rightOperand);
    case 'multiply':
      return multiply(leftOperand, rightOperand);
    case 'divide':
      return divide(leftOperand, rightOperand);
    default: {
      const unsupportedOperator: never = operator;
      return createCalculationError(`Unsupported operator: ${String(unsupportedOperator)}`);
    }
  }
}

export function calculate(operator: Operator, leftOperand: number, rightOperand: number): CalculationResult {
  return compute(operator, leftOperand, rightOperand);
}

export function computeCalculation(operator: Operator, leftOperand: number, rightOperand: number): CalculationResult {
  return compute(operator, leftOperand, rightOperand);
}
