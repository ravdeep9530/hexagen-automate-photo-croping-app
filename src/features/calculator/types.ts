export type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide';

export type CalculatorStatus = 'idle' | 'editing' | 'result' | 'error';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  /** ISO-8601 timestamp for when the history entry was created. */
  createdAt: string;
}

export interface CalculatorHistoryEntryInput {
  id?: string;
  expression: string;
  result: string;
  createdAt?: string | number | Date;
}

export interface CalculatorHistoryController {
  readonly history: readonly HistoryEntry[];
  addEntry(entry: CalculatorHistoryEntryInput | HistoryEntry): readonly HistoryEntry[];
  clearHistory(): readonly HistoryEntry[];
  setHistory(entries: readonly unknown[]): readonly HistoryEntry[];
}

export interface CalculatorState {
  /** Text currently shown on the calculator display. */
  display: string;
  /** Left-hand operand retained for a pending binary operation. */
  storedValue: string | null;
  /** Operator waiting to be evaluated with the current display buffer. */
  operator: CalculatorOperator | null;
  /** Human-readable expression for the pending or completed operation. */
  expression: string;
  /** Engine status, including controlled arithmetic errors. */
  status: CalculatorStatus;
  /** True when the next digit/decimal should replace the display buffer. */
  shouldOverwriteDisplay: boolean;
}

export type CalculatorAction =
  | { type: 'digit'; digit: Digit }
  | { type: 'decimal' }
  | { type: 'operator'; operator: CalculatorOperator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'restore-history'; entry: unknown };

export type CalculatorDispatch = (action: CalculatorAction) => void;

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type CalculatorButtonKind =
  | 'digit'
  | 'decimal'
  | 'operator'
  | 'equals'
  | 'clear';

export interface CalculatorButtonConfig {
  id: string;
  label: string;
  ariaLabel: string;
  kind: CalculatorButtonKind;
  digit?: Digit;
  operator?: CalculatorOperator;
  /** KeyboardEvent.key values that should trigger this calculator button. */
  keyboardKeys?: readonly string[];
  /**
   * Whether the keyboard handler should call preventDefault for matching keys.
   * Defaults to true for configured calculator keyboard shortcuts.
   */
  preventDefaultOnKeyboard?: boolean;
}
