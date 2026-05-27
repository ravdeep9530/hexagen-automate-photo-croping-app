import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculatorReducer,
  evaluateBinaryOperation,
  initialCalculatorState,
} from './engine';
import type { CalculatorAction, CalculatorState } from './types';

function reduce(actions: CalculatorAction[], seed: CalculatorState = initialCalculatorState) {
  return actions.reduce(calculatorReducer, seed);
}

describe('calculatorReducer', () => {
  it('supports digit, decimal, operator, equals, and clear actions', () => {
    const result = reduce([
      { type: 'digit', digit: '1' },
      { type: 'decimal' },
      { type: 'digit', digit: '5' },
      { type: 'operator', operator: 'add' },
      { type: 'digit', digit: '2' },
      { type: 'equals' },
    ]);

    assert.equal(result.display, '3.5');
    assert.equal(result.status, 'result');
    assert.equal(result.expression, '1.5 + 2 =');

    const cleared = calculatorReducer(result, { type: 'clear' });
    assert.deepEqual(cleared, initialCalculatorState);
  });

  it('evaluates chained binary operations from left to right', () => {
    const result = reduce([
      { type: 'digit', digit: '2' },
      { type: 'operator', operator: 'add' },
      { type: 'digit', digit: '3' },
      { type: 'operator', operator: 'multiply' },
      { type: 'digit', digit: '4' },
      { type: 'equals' },
    ]);

    assert.equal(result.display, '20');
    assert.equal(result.expression, '5 × 4 =');
  });

  it('returns a controlled division-by-zero error without throwing', () => {
    const result = reduce([
      { type: 'digit', digit: '8' },
      { type: 'operator', operator: 'divide' },
      { type: 'digit', digit: '0' },
      { type: 'equals' },
    ]);

    assert.equal(result.status, 'error');
    assert.equal(result.display, 'Cannot divide by zero');
  });

  it('prevents repeated decimal input within the current numeric buffer', () => {
    const result = reduce([
      { type: 'digit', digit: '1' },
      { type: 'decimal' },
      { type: 'decimal' },
      { type: 'digit', digit: '2' },
    ]);

    assert.equal(result.display, '1.2');
  });

  it('ignores malformed restore-history payloads without mutating state', () => {
    const state = reduce([{ type: 'digit', digit: '9' }]);
    const restored = calculatorReducer(state, {
      type: 'restore-history',
      entry: { expression: '1 + 1 =', result: '2' },
    });

    assert.strictEqual(restored, state);
  });

  it('restores valid history entries into display state', () => {
    const restored = calculatorReducer(initialCalculatorState, {
      type: 'restore-history',
      entry: {
        id: 'history-1',
        expression: '10 − 3 =',
        result: '7',
        createdAt: 1_700_000_000_000,
      },
    });

    assert.equal(restored.display, '7');
    assert.equal(restored.expression, '10 − 3 =');
    assert.equal(restored.status, 'result');
    assert.equal(restored.shouldOverwriteDisplay, true);
  });
});

describe('evaluateBinaryOperation', () => {
  it('uses explicit arithmetic for all supported operators', () => {
    assert.deepEqual(evaluateBinaryOperation('4', '2', 'add'), {
      status: 'result',
      result: '6',
    });
    assert.deepEqual(evaluateBinaryOperation('4', '2', 'subtract'), {
      status: 'result',
      result: '2',
    });
    assert.deepEqual(evaluateBinaryOperation('4', '2', 'multiply'), {
      status: 'result',
      result: '8',
    });
    assert.deepEqual(evaluateBinaryOperation('4', '2', 'divide'), {
      status: 'result',
      result: '2',
    });
  });
});
