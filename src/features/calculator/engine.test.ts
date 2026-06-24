import { describe, expect, it } from 'vitest';
import {
  calculatorReducer,
  evaluateBinaryOperation,
  initialCalculatorState,
} from './engine';
import { digit, enterDigits, reduceCalculatorActions } from './test-utils';
import type { CalculatorAction, CalculatorOperator } from './types';

function operator(operatorValue: CalculatorOperator): CalculatorAction {
  return { type: 'operator', operator: operatorValue };
}

describe('calculatorReducer arithmetic operations', () => {
  it('adds two operands', () => {
    const result = reduceCalculatorActions([
      ...enterDigits('12'),
      operator('add'),
      ...enterDigits('30'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('42');
    expect(result.status).toBe('result');
    expect(result.expression).toBe('12 + 30 =');
  });

  it('subtracts two operands', () => {
    const result = reduceCalculatorActions([
      ...enterDigits('50'),
      operator('subtract'),
      ...enterDigits('8'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('42');
    expect(result.status).toBe('result');
    expect(result.expression).toBe('50 − 8 =');
  });

  it('multiplies two operands', () => {
    const result = reduceCalculatorActions([
      ...enterDigits('7'),
      operator('multiply'),
      ...enterDigits('6'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('42');
    expect(result.status).toBe('result');
    expect(result.expression).toBe('7 × 6 =');
  });

  it('divides two operands', () => {
    const result = reduceCalculatorActions([
      ...enterDigits('84'),
      operator('divide'),
      ...enterDigits('2'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('42');
    expect(result.status).toBe('result');
    expect(result.expression).toBe('84 ÷ 2 =');
  });

  it('uses explicit arithmetic for every supported operator helper', () => {
    expect(evaluateBinaryOperation('4', '2', 'add')).toEqual({
      status: 'result',
      result: '6',
    });
    expect(evaluateBinaryOperation('4', '2', 'subtract')).toEqual({
      status: 'result',
      result: '2',
    });
    expect(evaluateBinaryOperation('4', '2', 'multiply')).toEqual({
      status: 'result',
      result: '8',
    });
    expect(evaluateBinaryOperation('4', '2', 'divide')).toEqual({
      status: 'result',
      result: '2',
    });
  });
});

describe('calculatorReducer editing semantics', () => {
  it('preserves decimal string editing semantics before evaluation', () => {
    const startsWithDecimal = reduceCalculatorActions([
      { type: 'decimal' },
      digit('5'),
    ]);
    expect(startsWithDecimal.display).toBe('0.5');

    const trailingDecimal = reduceCalculatorActions([
      digit('1'),
      digit('2'),
      { type: 'decimal' },
    ]);
    expect(trailingDecimal.display).toBe('12.');
    expect(trailingDecimal.status).toBe('editing');

    const duplicateDecimal = calculatorReducer(trailingDecimal, { type: 'decimal' });
    expect(duplicateDecimal).toBe(trailingDecimal);
    expect(duplicateDecimal.display).toBe('12.');

    const evaluated = reduceCalculatorActions([
      digit('1'),
      digit('2'),
      { type: 'decimal' },
      operator('add'),
      digit('3'),
      { type: 'equals' },
    ]);
    expect(evaluated.display).toBe('15');
    expect(evaluated.expression).toBe('12. + 3 =');
  });

  it('replaces the operator while waiting for the next operand', () => {
    const result = reduceCalculatorActions([
      digit('9'),
      operator('add'),
      operator('multiply'),
      digit('3'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('27');
    expect(result.expression).toBe('9 × 3 =');
  });

  it('replaces a completed result when entering a digit after equals', () => {
    const result = reduceCalculatorActions([
      digit('2'),
      operator('add'),
      digit('3'),
      { type: 'equals' },
      digit('9'),
    ]);

    expect(result.display).toBe('9');
    expect(result.status).toBe('editing');
    expect(result.storedValue).toBe(null);
    expect(result.operator).toBe(null);
    expect(result.expression).toBe('2 + 3 =');
    expect(result.shouldOverwriteDisplay).toBe(false);
  });

  it('starts a new editable decimal when decimal is pressed after equals', () => {
    const result = reduceCalculatorActions([
      digit('2'),
      operator('add'),
      digit('3'),
      { type: 'equals' },
      { type: 'decimal' },
      digit('7'),
    ]);

    expect(result.display).toBe('0.7');
    expect(result.status).toBe('editing');
  });
});

describe('calculatorReducer state transitions', () => {
  it('resets to the initial calculator state when clear is pressed', () => {
    const dirtyState = reduceCalculatorActions([
      ...enterDigits('123'),
      operator('divide'),
      { type: 'decimal' },
      digit('5'),
    ]);

    const cleared = calculatorReducer(dirtyState, { type: 'clear' });

    expect(cleared).toEqual(initialCalculatorState);
    expect(cleared).not.toBe(initialCalculatorState);
  });

  it('produces the exact division by zero message', () => {
    const result = reduceCalculatorActions([
      digit('8'),
      operator('divide'),
      digit('0'),
      { type: 'equals' },
    ]);

    expect(result.status).toBe('error');
    expect(result.display).toBe('Cannot divide by zero');
    expect(result.expression).toBe('8 ÷ 0 =');
    expect(result.shouldOverwriteDisplay).toBe(true);
  });

  it('does not restore malformed history entries', () => {
    const state = reduceCalculatorActions([digit('9')]);
    const malformedEntries: unknown[] = [
      null,
      '10 + 5 = 15',
      { expression: '10 + 5 =', result: '15', createdAt: 1_700_000_000_000 },
      { id: '', expression: '10 + 5 =', result: '15', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '', result: '15', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '10 + 5 =', result: '', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '10 + 5 =', result: '15', createdAt: Number.NaN },
    ];

    for (const entry of malformedEntries) {
      const restored = calculatorReducer(state, { type: 'restore-history', entry });
      expect(restored).toBe(state);
    }
  });

  it('restores valid history entries into result display state', () => {
    const restored = calculatorReducer(initialCalculatorState, {
      type: 'restore-history',
      entry: {
        id: 'history-1',
        expression: '10 − 3 =',
        result: '7',
        createdAt: 1_700_000_000_000,
      },
    });

    expect(restored).toEqual({
      display: '7',
      storedValue: null,
      operator: null,
      expression: '10 − 3 =',
      status: 'result',
      shouldOverwriteDisplay: true,
    });
  });
});

describe('calculatorReducer chained calculations', () => {
  it('evaluates chained binary operations deterministically from left to right', () => {
    const result = reduceCalculatorActions([
      digit('2'),
      operator('add'),
      digit('3'),
      operator('multiply'),
      digit('4'),
      operator('subtract'),
      digit('5'),
      { type: 'equals' },
    ]);

    expect(result.display).toBe('15');
    expect(result.expression).toBe('20 − 5 =');
    expect(result.status).toBe('result');
  });

  it('surfaces division by zero during a chained operator press', () => {
    const result = reduceCalculatorActions([
      digit('9'),
      operator('divide'),
      digit('0'),
      operator('add'),
    ]);

    expect(result.display).toBe('Cannot divide by zero');
    expect(result.status).toBe('error');
    expect(result.expression).toBe('9 ÷ 0');
    expect(result.operator).toBe('divide');
  });
});
