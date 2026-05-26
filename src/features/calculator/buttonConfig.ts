export const CALCULATOR_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export const CALCULATOR_OPERATORS = ["add", "subtract", "multiply", "divide"] as const;

export type CalculatorDigit = (typeof CALCULATOR_DIGITS)[number];
export type CalculatorOperator = (typeof CALCULATOR_OPERATORS)[number];

export type CalculatorAction =
  | { readonly type: "digit"; readonly digit: CalculatorDigit }
  | { readonly type: "decimal" }
  | { readonly type: "operator"; readonly operator: CalculatorOperator }
  | { readonly type: "equals" }
  | { readonly type: "clear" };

export type CalculatorButtonVariant = "text" | "outlined" | "contained";
export type KeypadBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
export type ResponsiveGridSpan = number | Readonly<Partial<Record<KeypadBreakpoint, number>>>;

export interface CalculatorButtonConfig {
  readonly id: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly variant: CalculatorButtonVariant;
  readonly action: CalculatorAction;
  readonly gridSpan?: ResponsiveGridSpan;
}

export const calculatorButtonConfig = [
  {
    id: "clear",
    label: "C",
    ariaLabel: "Clear calculator",
    variant: "outlined",
    action: { type: "clear" },
    gridSpan: { xs: 2, sm: 2 },
  },
  {
    id: "divide",
    label: "÷",
    ariaLabel: "Divide",
    variant: "contained",
    action: { type: "operator", operator: "divide" },
  },
  {
    id: "multiply",
    label: "×",
    ariaLabel: "Multiply",
    variant: "contained",
    action: { type: "operator", operator: "multiply" },
  },
  {
    id: "digit-7",
    label: "7",
    ariaLabel: "Digit 7",
    variant: "contained",
    action: { type: "digit", digit: "7" },
  },
  {
    id: "digit-8",
    label: "8",
    ariaLabel: "Digit 8",
    variant: "contained",
    action: { type: "digit", digit: "8" },
  },
  {
    id: "digit-9",
    label: "9",
    ariaLabel: "Digit 9",
    variant: "contained",
    action: { type: "digit", digit: "9" },
  },
  {
    id: "subtract",
    label: "−",
    ariaLabel: "Subtract",
    variant: "contained",
    action: { type: "operator", operator: "subtract" },
  },
  {
    id: "digit-4",
    label: "4",
    ariaLabel: "Digit 4",
    variant: "contained",
    action: { type: "digit", digit: "4" },
  },
  {
    id: "digit-5",
    label: "5",
    ariaLabel: "Digit 5",
    variant: "contained",
    action: { type: "digit", digit: "5" },
  },
  {
    id: "digit-6",
    label: "6",
    ariaLabel: "Digit 6",
    variant: "contained",
    action: { type: "digit", digit: "6" },
  },
  {
    id: "add",
    label: "+",
    ariaLabel: "Add",
    variant: "contained",
    action: { type: "operator", operator: "add" },
  },
  {
    id: "digit-1",
    label: "1",
    ariaLabel: "Digit 1",
    variant: "contained",
    action: { type: "digit", digit: "1" },
  },
  {
    id: "digit-2",
    label: "2",
    ariaLabel: "Digit 2",
    variant: "contained",
    action: { type: "digit", digit: "2" },
  },
  {
    id: "digit-3",
    label: "3",
    ariaLabel: "Digit 3",
    variant: "contained",
    action: { type: "digit", digit: "3" },
  },
  {
    id: "equals",
    label: "=",
    ariaLabel: "Equals",
    variant: "contained",
    action: { type: "equals" },
  },
  {
    id: "digit-0",
    label: "0",
    ariaLabel: "Digit 0",
    variant: "contained",
    action: { type: "digit", digit: "0" },
    gridSpan: { xs: 2, sm: 2 },
  },
  {
    id: "decimal",
    label: ".",
    ariaLabel: "Decimal point",
    variant: "contained",
    action: { type: "decimal" },
  },
] as const satisfies readonly CalculatorButtonConfig[];
