export type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide';

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; operator: CalculatorOperator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'toggleSign' }
  | { type: 'percent' };

export interface CalculatorState {
  displayValue: string;
  storedValue: string | null;
  pendingOperator: CalculatorOperator | null;
  waitingForOperand: boolean;
  error: string | null;
}

export const DIVIDE_BY_ZERO_ERROR = 'Cannot divide by zero';

export const initialCalculatorState: CalculatorState = {
  displayValue: '0',
  storedValue: null,
  pendingOperator: null,
  waitingForOperand: false,
  error: null,
};

const MAX_DISPLAY_LENGTH = 14;

function toNumber(value: string): number {
  return Number.parseFloat(value);
}

function formatDisplayValue(value: number): string {
  if (Object.is(value, -0)) {
    return '0';
  }

  if (!Number.isFinite(value)) {
    return DIVIDE_BY_ZERO_ERROR;
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  const asString = String(rounded);

  if (asString.length <= MAX_DISPLAY_LENGTH) {
    return asString;
  }

  return rounded.toExponential(8);
}

function calculate(left: string, right: string, operator: CalculatorOperator): string | null {
  const a = toNumber(left);
  const b = toNumber(right);

  switch (operator) {
    case 'add':
      return formatDisplayValue(a + b);
    case 'subtract':
      return formatDisplayValue(a - b);
    case 'multiply':
      return formatDisplayValue(a * b);
    case 'divide':
      return b === 0 ? null : formatDisplayValue(a / b);
    default:
      return formatDisplayValue(b);
  }
}

function appendDigit(state: CalculatorState, value: string): CalculatorState {
  if (state.error) {
    return { ...initialCalculatorState, displayValue: value };
  }

  if (state.waitingForOperand) {
    return { ...state, displayValue: value, waitingForOperand: false };
  }

  if (state.displayValue === '0') {
    return { ...state, displayValue: value };
  }

  if (state.displayValue.replace('-', '').replace('.', '').length >= MAX_DISPLAY_LENGTH) {
    return state;
  }

  return { ...state, displayValue: `${state.displayValue}${value}` };
}

function applyPendingOperator(state: CalculatorState, nextOperator: CalculatorOperator): CalculatorState {
  if (state.error) {
    return { ...initialCalculatorState, pendingOperator: nextOperator, waitingForOperand: true };
  }

  if (state.storedValue === null) {
    return {
      ...state,
      storedValue: state.displayValue,
      pendingOperator: nextOperator,
      waitingForOperand: true,
    };
  }

  if (state.waitingForOperand) {
    return { ...state, pendingOperator: nextOperator };
  }

  const result = calculate(state.storedValue, state.displayValue, state.pendingOperator ?? nextOperator);

  if (result === null) {
    return { ...initialCalculatorState, error: DIVIDE_BY_ZERO_ERROR };
  }

  return {
    displayValue: result,
    storedValue: result,
    pendingOperator: nextOperator,
    waitingForOperand: true,
    error: null,
  };
}

function evaluate(state: CalculatorState): CalculatorState {
  if (state.error || state.storedValue === null || state.pendingOperator === null) {
    return state;
  }

  const result = calculate(state.storedValue, state.displayValue, state.pendingOperator);

  if (result === null) {
    return { ...initialCalculatorState, error: DIVIDE_BY_ZERO_ERROR };
  }

  return {
    displayValue: result,
    storedValue: null,
    pendingOperator: null,
    waitingForOperand: true,
    error: null,
  };
}

export function calculatorReducer(
  state: CalculatorState = initialCalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'digit':
      return appendDigit(state, action.value);
    case 'decimal':
      if (state.error) {
        return { ...initialCalculatorState, displayValue: '0.' };
      }
      if (state.waitingForOperand) {
        return { ...state, displayValue: '0.', waitingForOperand: false };
      }
      return state.displayValue.includes('.') ? state : { ...state, displayValue: `${state.displayValue}.` };
    case 'operator':
      return applyPendingOperator(state, action.operator);
    case 'equals':
      return evaluate(state);
    case 'clear':
      return initialCalculatorState;
    case 'toggleSign':
      if (state.error || state.displayValue === '0') {
        return state;
      }
      return {
        ...state,
        displayValue: state.displayValue.startsWith('-')
          ? state.displayValue.slice(1)
          : `-${state.displayValue}`,
      };
    case 'percent': {
      if (state.error) {
        return initialCalculatorState;
      }
      return { ...state, displayValue: formatDisplayValue(toNumber(state.displayValue) / 100) };
    }
    default:
      return state;
  }
}
