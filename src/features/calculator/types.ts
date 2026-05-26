export type Operator = 'add' | 'subtract' | 'multiply' | 'divide';

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type CalculatorAction =
  | { type: 'inputDigit'; digit: Digit }
  | { type: 'inputDecimal' }
  | { type: 'chooseOperator'; operator: Operator }
  | { type: 'calculate' }
  | { type: 'clear' }
  | { type: 'delete' }
  | { type: 'toggleSign' }
  | { type: 'setValue'; value: string };

export interface CalculatorState {
  displayValue: string;
  currentValue: number | null;
  storedValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  error: string | null;
}

export interface ButtonConfig {
  id: string;
  label: string;
  action: CalculatorAction;
  ariaLabel?: string;
  variant?: 'digit' | 'operator' | 'utility' | 'equals';
  disabled?: boolean;
}

export interface CalculationResult {
  value: number | null;
  display: string;
  error: string | null;
}
