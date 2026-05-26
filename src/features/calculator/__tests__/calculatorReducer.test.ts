import { describe, expect, it } from "vitest";
import {
  calculatorReducer,
  initialCalculatorState,
  type CalculatorState,
} from "../calculatorReducer";

function reduce(actions: Parameters<typeof calculatorReducer>[1][]): CalculatorState {
  return actions.reduce<CalculatorState>(
    (state, action) => calculatorReducer(state, action),
    initialCalculatorState,
  );
}

describe("calculatorReducer", () => {
  it("initializes to the expected default state", () => {
    expect(calculatorReducer(undefined, { type: "unknown" })).toEqual({
      display: "0",
      accumulator: null,
      pendingOperator: null,
      waitingForOperand: false,
      error: null,
      lastAction: null,
    });
  });

  it("appends digit input and replaces display while waiting for an operand", () => {
    const enteredDigits = reduce([
      { type: "inputDigit", digit: "1" },
      { type: "inputDigit", digit: 2 },
    ]);

    expect(enteredDigits.display).toBe("12");
    expect(enteredDigits.waitingForOperand).toBe(false);
    expect(enteredDigits.lastAction).toBe("inputDigit");

    const waitingForOperand = calculatorReducer(enteredDigits, {
      type: "selectOperator",
      operator: "+",
    });
    const replacedOperand = calculatorReducer(waitingForOperand, {
      type: "inputDigit",
      digit: "3",
    });

    expect(waitingForOperand.display).toBe("12");
    expect(waitingForOperand.accumulator).toBe(12);
    expect(waitingForOperand.pendingOperator).toBe("+");
    expect(waitingForOperand.waitingForOperand).toBe(true);
    expect(replacedOperand.display).toBe("3");
    expect(replacedOperand.waitingForOperand).toBe(false);
  });

  it("inserts only one decimal point and starts decimals with 0 when appropriate", () => {
    const decimalFromInitial = reduce([
      { type: "inputDecimal" },
      { type: "inputDigit", digit: "5" },
      { type: "inputDecimal" },
    ]);

    expect(decimalFromInitial.display).toBe("0.5");

    const waitingForOperand = calculatorReducer(decimalFromInitial, {
      type: "selectOperator",
      operator: "+",
    });
    const decimalAfterOperator = calculatorReducer(waitingForOperand, { type: "inputDecimal" });

    expect(decimalAfterOperator.display).toBe("0.");
    expect(decimalAfterOperator.waitingForOperand).toBe(false);
  });

  it("clear resets calculator state", () => {
    const dirtyState = reduce([
      { type: "inputDigit", digit: "9" },
      { type: "selectOperator", operator: "*" },
      { type: "inputDigit", digit: "8" },
    ]);

    expect(dirtyState).not.toEqual(initialCalculatorState);
    expect(calculatorReducer(dirtyState, { type: "clear" })).toEqual({
      ...initialCalculatorState,
      lastAction: "clear",
    });
  });

  it("evaluates existing pending operations when chaining operators", () => {
    const chained = reduce([
      { type: "inputDigit", digit: "2" },
      { type: "selectOperator", operator: "+" },
      { type: "inputDigit", digit: "3" },
      { type: "selectOperator", operator: "*" },
    ]);

    expect(chained.display).toBe("5");
    expect(chained.accumulator).toBe(5);
    expect(chained.pendingOperator).toBe("*");
    expect(chained.waitingForOperand).toBe(true);

    const result = reduce([
      { type: "inputDigit", digit: "2" },
      { type: "selectOperator", operator: "+" },
      { type: "inputDigit", digit: "3" },
      { type: "selectOperator", operator: "*" },
      { type: "inputDigit", digit: "4" },
      { type: "calculate" },
    ]);

    expect(result.display).toBe("20");
    expect(result.accumulator).toBeNull();
    expect(result.pendingOperator).toBeNull();
    expect(result.waitingForOperand).toBe(true);
  });

  it("calculate applies the pending operation and clears the pending operator", () => {
    const result = reduce([
      { type: "inputDigit", digit: "7" },
      { type: "selectOperator", operator: "-" },
      { type: "inputDigit", digit: "2" },
      { type: "calculate" },
    ]);

    expect(result.display).toBe("5");
    expect(result.accumulator).toBeNull();
    expect(result.pendingOperator).toBeNull();
    expect(result.waitingForOperand).toBe(true);
    expect(result.error).toBeNull();
    expect(result.lastAction).toBe("calculate");
  });

  it("calculate is a no-op when no pending operation exists", () => {
    const state = reduce([{ type: "inputDigit", digit: "9" }]);
    const afterCalculate = calculatorReducer(state, { type: "calculate" });

    expect(afterCalculate).toBe(state);
    expect(afterCalculate.display).toBe("9");
    expect(afterCalculate.pendingOperator).toBeNull();
    expect(afterCalculate.error).toBeNull();
  });

  it("enters divide-by-zero error state and recovers on next digit", () => {
    const errorState = reduce([
      { type: "inputDigit", digit: "8" },
      { type: "selectOperator", operator: "/" },
      { type: "inputDigit", digit: "0" },
      { type: "calculate" },
    ]);

    expect(errorState.display).toBe("Error");
    expect(errorState.accumulator).toBeNull();
    expect(errorState.pendingOperator).toBeNull();
    expect(errorState.waitingForOperand).toBe(true);
    expect(errorState.error).toBe("Cannot divide by zero");

    const recovered = calculatorReducer(errorState, { type: "inputDigit", digit: "4" });

    expect(recovered).toEqual({
      ...initialCalculatorState,
      display: "4",
      waitingForOperand: false,
      lastAction: "inputDigit",
    });
  });

  it("ignores invalid action payloads without corrupting state", () => {
    const state = reduce([{ type: "inputDigit", digit: "6" }]);

    expect(calculatorReducer(state, { type: "inputDigit", digit: "12" })).toBe(state);
    expect(calculatorReducer(state, { type: "selectOperator", operator: "%" })).toBe(state);
    expect(calculatorReducer(state, { type: "unknown", digit: "7" })).toBe(state);
    expect(calculatorReducer(state, null as unknown as Parameters<typeof calculatorReducer>[1])).toBe(
      state,
    );
  });
});
