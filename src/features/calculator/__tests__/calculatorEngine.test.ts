import { describe, expect, it } from 'vitest';

import type {
  ButtonConfig,
  CalculationResult,
  CalculatorAction,
  CalculatorState,
  Operator,
} from '../types';
import { formatCalculatorValue } from '../calculatorFormat';
import {
  CALCULATOR_ERRORS,
  add,
  compute,
  divide,
  multiply,
  subtract,
} from '../calculatorEngine';

describe('calculator domain types', () => {
  it('allows strongly typed calculator state, actions, operators, buttons, and results', () => {
    const operator: Operator = 'add';
    const action: CalculatorAction = { type: 'chooseOperator', operator };
    const button: ButtonConfig = {
      id: 'operator-add',
      label: '+',
      action,
      ariaLabel: 'Add',
      variant: 'operator',
    };
    const state: CalculatorState = {
      displayValue: '12',
      currentValue: 12,
      storedValue: null,
      operator: null,
      waitingForOperand: false,
      error: null,
    };
    const result: CalculationResult = { value: 12, display: '12', error: null };

    expect(button.action).toEqual(action);
    expect(state.currentValue).toBe(result.value);
  });
});

describe('calculator arithmetic engine', () => {
  it('adds, subtracts, multiplies, and divides successfully', () => {
    expect(add(2, 3)).toEqual({ value: 5, display: '5', error: null });
    expect(subtract(10, 4)).toEqual({ value: 6, display: '6', error: null });
    expect(multiply(6, 7)).toEqual({ value: 42, display: '42', error: null });
    expect(divide(21, 3)).toEqual({ value: 7, display: '7', error: null });
  });

  it('computes through the pure operator dispatch helper', () => {
    expect(compute('add', 8, 4)).toEqual({ value: 12, display: '12', error: null });
    expect(compute('subtract', 8, 4)).toEqual({ value: 4, display: '4', error: null });
    expect(compute('multiply', 8, 4)).toEqual({ value: 32, display: '32', error: null });
    expect(compute('divide', 8, 4)).toEqual({ value: 2, display: '2', error: null });
  });

  it('formats decimal arithmetic deterministically', () => {
    expect(add(0.1, 0.2)).toEqual({ value: 0.3, display: '0.3', error: null });
    expect(multiply(1.5, 2.5)).toEqual({ value: 3.75, display: '3.75', error: null });
    expect(divide(1, 4)).toEqual({ value: 0.25, display: '0.25', error: null });
  });

  it('supports negative results and negative inputs', () => {
    expect(subtract(5, 9)).toEqual({ value: -4, display: '-4', error: null });
    expect(multiply(-3, 2.5)).toEqual({ value: -7.5, display: '-7.5', error: null });
    expect(add(-10, -15)).toEqual({ value: -25, display: '-25', error: null });
  });

  it('returns a deterministic divide-by-zero error without successful Infinity or NaN values', () => {
    const result = divide(10, 0);

    expect(result).toEqual({
      value: null,
      display: 'Error',
      error: CALCULATOR_ERRORS.DIVIDE_BY_ZERO,
    });
    expect(result.value).not.toBe(Number.POSITIVE_INFINITY);
    expect(result.value).not.toBe(Number.NEGATIVE_INFINITY);
    expect(Number.isNaN(result.value)).toBe(false);
  });

  it('converts invalid numeric states to deterministic error results', () => {
    expect(add(Number.NaN, 1)).toEqual({ value: null, display: 'Error', error: 'Invalid number' });
    expect(subtract(1, Number.POSITIVE_INFINITY)).toEqual({ value: null, display: 'Error', error: 'Invalid number' });
    expect(multiply(Number.NEGATIVE_INFINITY, 2)).toEqual({ value: null, display: 'Error', error: 'Invalid number' });
  });
});

describe('calculator formatting helper', () => {
  it('returns stable display strings for integers, decimals, negatives, and finite results', () => {
    expect(formatCalculatorValue(12)).toBe('12');
    expect(formatCalculatorValue(12.34)).toBe('12.34');
    expect(formatCalculatorValue(-12.34)).toBe('-12.34');
    expect(formatCalculatorValue(1 / 8)).toBe('0.125');
    expect(formatCalculatorValue(-0)).toBe('0');
  });

  it('formats invalid values as Error', () => {
    expect(formatCalculatorValue(Number.NaN)).toBe('Error');
    expect(formatCalculatorValue(Number.POSITIVE_INFINITY)).toBe('Error');
    expect(formatCalculatorValue(Number.NEGATIVE_INFINITY)).toBe('Error');
  });
});
