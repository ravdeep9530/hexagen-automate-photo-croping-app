export type Operator = "+" | "-" | "*" | "/";

export type LastAction =
  | "inputDigit"
  | "inputDecimal"
  | "selectOperator"
  | "calculate"
  | "clear"
  | null;

export interface CalculatorState {
  display: string;
  accumulator: number | null;
  pendingOperator: Operator | null;
  waitingForOperand: boolean;
  error: string | null;
  lastAction: LastAction;
}

export type CalculatorAction =
  | { type: "inputDigit"; digit: string | number }
  | { type: "inputDecimal" }
  | { type: "selectOperator"; operator: Operator }
  | { type: "calculate" }
  | { type: "clear" };

type UnknownCalculatorAction = {
  type?: unknown;
  [key: string]: unknown;
};

export const initialCalculatorState: CalculatorState = {
  display: "0",
  accumulator: null,
  pendingOperator: null,
  waitingForOperand: false,
  error: null,
  lastAction: null,
};

function createInitialState(overrides: Partial<CalculatorState> = {}): CalculatorState {
  return {
    ...initialCalculatorState,
    ...overrides,
  };
}

function normalizeDigit(digit: unknown): string | null {
  if (typeof digit === "number" && Number.isInteger(digit) && digit >= 0 && digit <= 9) {
    return String(digit);
  }

  if (typeof digit === "string" && /^[0-9]$/.test(digit)) {
    return digit;
  }

  return null;
}

function normalizeOperator(operator: unknown): Operator | null {
  return operator === "+" || operator === "-" || operator === "*" || operator === "/"
    ? operator
    : null;
}

function parseDisplayValue(display: string): number | null {
  const value = Number(display);
  return Number.isFinite(value) ? value : null;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function toErrorState(message: string, lastAction: LastAction): CalculatorState {
  return {
    display: "Error",
    accumulator: null,
    pendingOperator: null,
    waitingForOperand: true,
    error: message,
    lastAction,
  };
}

function applyOperation(
  leftOperand: number,
  operator: Operator,
  rightOperand: number,
): { result: number; error: null } | { result: null; error: string } {
  switch (operator) {
    case "+":
      return { result: leftOperand + rightOperand, error: null };
    case "-":
      return { result: leftOperand - rightOperand, error: null };
    case "*":
      return { result: leftOperand * rightOperand, error: null };
    case "/":
      if (rightOperand === 0) {
        return { result: null, error: "Cannot divide by zero" };
      }
      return { result: leftOperand / rightOperand, error: null };
    default:
      return { result: null, error: "Unsupported operator" };
  }
}

function inputDigit(state: CalculatorState, digit: unknown): CalculatorState {
  const normalizedDigit = normalizeDigit(digit);

  if (normalizedDigit === null) {
    return state;
  }

  if (state.error !== null) {
    return createInitialState({
      display: normalizedDigit,
      waitingForOperand: false,
      lastAction: "inputDigit",
    });
  }

  if (state.waitingForOperand) {
    return {
      ...state,
      display: normalizedDigit,
      waitingForOperand: false,
      error: null,
      lastAction: "inputDigit",
    };
  }

  return {
    ...state,
    display: state.display === "0" ? normalizedDigit : `${state.display}${normalizedDigit}`,
    error: null,
    lastAction: "inputDigit",
  };
}

function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error !== null) {
    return createInitialState({
      display: "0.",
      waitingForOperand: false,
      lastAction: "inputDecimal",
    });
  }

  if (state.waitingForOperand) {
    return {
      ...state,
      display: "0.",
      waitingForOperand: false,
      error: null,
      lastAction: "inputDecimal",
    };
  }

  if (state.display.includes(".")) {
    return state;
  }

  return {
    ...state,
    display: `${state.display}.`,
    error: null,
    lastAction: "inputDecimal",
  };
}

function selectOperator(state: CalculatorState, operator: unknown): CalculatorState {
  const normalizedOperator = normalizeOperator(operator);

  if (normalizedOperator === null || state.error !== null) {
    return state;
  }

  const currentValue = parseDisplayValue(state.display);

  if (currentValue === null) {
    return toErrorState("Invalid number", "selectOperator");
  }

  if (state.accumulator === null || state.pendingOperator === null) {
    return {
      ...state,
      accumulator: currentValue,
      pendingOperator: normalizedOperator,
      waitingForOperand: true,
      error: null,
      lastAction: "selectOperator",
    };
  }

  if (state.waitingForOperand) {
    return {
      ...state,
      pendingOperator: normalizedOperator,
      error: null,
      lastAction: "selectOperator",
    };
  }

  const evaluation = applyOperation(state.accumulator, state.pendingOperator, currentValue);

  if (evaluation.error !== null) {
    return toErrorState(evaluation.error, "selectOperator");
  }

  return {
    ...state,
    display: formatNumber(evaluation.result),
    accumulator: evaluation.result,
    pendingOperator: normalizedOperator,
    waitingForOperand: true,
    error: null,
    lastAction: "selectOperator",
  };
}

function calculate(state: CalculatorState): CalculatorState {
  if (state.error !== null || state.accumulator === null || state.pendingOperator === null) {
    return state;
  }

  const currentValue = parseDisplayValue(state.display);

  if (currentValue === null) {
    return toErrorState("Invalid number", "calculate");
  }

  const evaluation = applyOperation(state.accumulator, state.pendingOperator, currentValue);

  if (evaluation.error !== null) {
    return toErrorState(evaluation.error, "calculate");
  }

  return {
    display: formatNumber(evaluation.result),
    accumulator: null,
    pendingOperator: null,
    waitingForOperand: true,
    error: null,
    lastAction: "calculate",
  };
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction | UnknownCalculatorAction,
): CalculatorState;
export function calculatorReducer(
  state: CalculatorState | undefined,
  action: CalculatorAction | UnknownCalculatorAction,
): CalculatorState {
  const currentState = state ?? initialCalculatorState;

  if (action === null || typeof action !== "object") {
    return currentState;
  }

  switch (action.type) {
    case "inputDigit":
      return inputDigit(currentState, action.digit);
    case "inputDecimal":
      return inputDecimal(currentState);
    case "selectOperator":
      return selectOperator(currentState, action.operator);
    case "calculate":
      return calculate(currentState);
    case "clear":
      return createInitialState({ lastAction: "clear" });
    default:
      return currentState;
  }
}

export default calculatorReducer;
