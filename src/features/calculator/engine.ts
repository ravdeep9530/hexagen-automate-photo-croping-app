import type {
  CalculatorAction,
  CalculatorOperator,
  CalculatorState,
  HistoryEntry,
} from './types';

const DIVIDE_BY_ZERO_MESSAGE = 'Cannot divide by zero';

export const initialCalculatorState: CalculatorState = Object.freeze({
  display: '0',
  storedValue: null,
  operator: null,
  expression: '',
  status: 'idle',
  shouldOverwriteDisplay: false,
});

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'digit':
      return inputDigit(state, action.digit);
    case 'decimal':
      return inputDecimal(state);
    case 'operator':
      return inputOperator(state, action.operator);
    case 'equals':
      return inputEquals(state);
    case 'clear':
      return { ...initialCalculatorState };
    case 'restore-history':
      return restoreHistory(state, action.entry);
    default:
      return state;
  }
}

export function applyOperator(
  left: number,
  right: number,
  operator: CalculatorOperator,
): number | typeof DIVIDE_BY_ZERO_MESSAGE {
  switch (operator) {
    case 'add':
      return left + right;
    case 'subtract':
      return left - right;
    case 'multiply':
      return left * right;
    case 'divide':
      return right === 0 ? DIVIDE_BY_ZERO_MESSAGE : left / right;
  }
}

export function evaluateBinaryOperation(
  leftValue: string,
  rightValue: string,
  operator: CalculatorOperator,
): { status: 'result'; result: string } | { status: 'error'; result: typeof DIVIDE_BY_ZERO_MESSAGE } {
  const left = Number(leftValue);
  const right = Number(rightValue);
  const rawResult = applyOperator(left, right, operator);

  if (rawResult === DIVIDE_BY_ZERO_MESSAGE) {
    return { status: 'error', result: DIVIDE_BY_ZERO_MESSAGE };
  }

  return { status: 'result', result: normalizeDisplayValue(rawResult) };
}

export function normalizeDisplayValue(value: number | string): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    // Limit floating-point noise while preserving regular decimal results.
    return String(Number(value.toPrecision(12)));
  }

  if (value === '' || value === '-' || value === '.' || value === '-.') {
    return '0';
  }

  if (value.endsWith('.') && value.indexOf('.') === value.length - 1) {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return String(Number(value));
}

export function operatorSymbol(operator: CalculatorOperator): string {
  switch (operator) {
    case 'add':
      return '+';
    case 'subtract':
      return '−';
    case 'multiply':
      return '×';
    case 'divide':
      return '÷';
  }
}

function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.status === 'error' || state.shouldOverwriteDisplay) {
    return {
      ...state,
      display: digit,
      status: 'editing',
      shouldOverwriteDisplay: false,
      expression: state.status === 'error' ? '' : state.expression,
      storedValue: state.status === 'error' ? null : state.storedValue,
      operator: state.status === 'error' ? null : state.operator,
    };
  }

  const nextDisplay = state.display === '0' ? digit : `${state.display}${digit}`;

  return {
    ...state,
    display: nextDisplay,
    status: 'editing',
  };
}

function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.status === 'error' || state.shouldOverwriteDisplay) {
    return {
      ...state,
      display: '0.',
      status: 'editing',
      shouldOverwriteDisplay: false,
      expression: state.status === 'error' ? '' : state.expression,
      storedValue: state.status === 'error' ? null : state.storedValue,
      operator: state.status === 'error' ? null : state.operator,
    };
  }

  if (state.display.includes('.')) {
    return state;
  }

  return {
    ...state,
    display: `${state.display}.`,
    status: 'editing',
  };
}

function inputOperator(
  state: CalculatorState,
  nextOperator: CalculatorOperator,
): CalculatorState {
  if (state.status === 'error') {
    return state;
  }

  if (state.operator && state.shouldOverwriteDisplay) {
    return {
      ...state,
      operator: nextOperator,
      expression: `${state.storedValue ?? state.display} ${operatorSymbol(nextOperator)}`,
    };
  }

  if (state.operator && state.storedValue !== null) {
    const evaluation = evaluateBinaryOperation(
      state.storedValue,
      state.display,
      state.operator,
    );

    if (evaluation.status === 'error') {
      return {
        ...state,
        display: evaluation.result,
        status: 'error',
        expression: `${state.storedValue} ${operatorSymbol(state.operator)} ${state.display}`,
        shouldOverwriteDisplay: true,
      };
    }

    return {
      display: evaluation.result,
      storedValue: evaluation.result,
      operator: nextOperator,
      expression: `${evaluation.result} ${operatorSymbol(nextOperator)}`,
      status: 'result',
      shouldOverwriteDisplay: true,
    };
  }

  const normalized = normalizeDisplayValue(state.display);
  return {
    ...state,
    display: normalized,
    storedValue: normalized,
    operator: nextOperator,
    expression: `${normalized} ${operatorSymbol(nextOperator)}`,
    status: 'result',
    shouldOverwriteDisplay: true,
  };
}

function inputEquals(state: CalculatorState): CalculatorState {
  if (state.status === 'error' || !state.operator || state.storedValue === null) {
    return state;
  }

  const rightValue = state.display;
  const evaluation = evaluateBinaryOperation(
    state.storedValue,
    rightValue,
    state.operator,
  );
  const expression = `${state.storedValue} ${operatorSymbol(state.operator)} ${normalizeDisplayValue(rightValue)} =`;

  if (evaluation.status === 'error') {
    return {
      ...state,
      display: evaluation.result,
      storedValue: null,
      operator: null,
      expression,
      status: 'error',
      shouldOverwriteDisplay: true,
    };
  }

  return {
    display: evaluation.result,
    storedValue: null,
    operator: null,
    expression,
    status: 'result',
    shouldOverwriteDisplay: true,
  };
}

function restoreHistory(state: CalculatorState, entry: unknown): CalculatorState {
  if (!isHistoryEntry(entry)) {
    return state;
  }

  return {
    display: entry.result,
    storedValue: null,
    operator: null,
    expression: entry.expression,
    status: 'result',
    shouldOverwriteDisplay: true,
  };
}

export function isHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }

  const candidate = entry as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.expression === 'string' &&
    candidate.expression.length > 0 &&
    typeof candidate.result === 'string' &&
    candidate.result.length > 0 &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt)
  );
}
