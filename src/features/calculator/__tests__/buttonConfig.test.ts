import { describe, expect, it } from "vitest";

import {
  CALCULATOR_DIGITS,
  CALCULATOR_OPERATORS,
  calculatorButtonConfig,
  type ResponsiveGridSpan,
} from "../buttonConfig";

const actionKeyForButton = (button: (typeof calculatorButtonConfig)[number]): string => {
  switch (button.action.type) {
    case "digit":
      return `digit:${button.action.digit}`;
    case "operator":
      return `operator:${button.action.operator}`;
    default:
      return button.action.type;
  }
};

const hasWiderGridSpan = (gridSpan: ResponsiveGridSpan | undefined): boolean => {
  if (gridSpan === undefined) {
    return false;
  }

  if (typeof gridSpan === "number") {
    return gridSpan > 1;
  }

  return Object.values(gridSpan).some((span) => typeof span === "number" && span > 1);
};

describe("calculatorButtonConfig", () => {
  it("includes the full required calculator control set", () => {
    const expectedControls = new Set([
      ...CALCULATOR_DIGITS.map((digit) => `digit:${digit}`),
      ...CALCULATOR_OPERATORS.map((operator) => `operator:${operator}`),
      "decimal",
      "equals",
      "clear",
    ]);

    const configuredControls = new Set(calculatorButtonConfig.map(actionKeyForButton));

    expect(configuredControls).toEqual(expectedControls);
    expect(calculatorButtonConfig).toHaveLength(expectedControls.size);
  });

  it("provides required display, accessibility, style, and action fields for every button", () => {
    for (const button of calculatorButtonConfig) {
      expect(button.label.trim()).not.toBe("");
      expect(button.ariaLabel.trim()).not.toBe("");
      expect(["text", "outlined", "contained"]).toContain(button.variant);
      expect(button.action.type).toBeTruthy();
    }
  });

  it("uses only typed operator action values", () => {
    const configuredOperators = calculatorButtonConfig
      .filter((button) => button.action.type === "operator")
      .map((button) => (button.action.type === "operator" ? button.action.operator : undefined));

    expect(new Set(configuredOperators)).toEqual(new Set(CALCULATOR_OPERATORS));
  });

  it("uses only valid digit strings for digit actions", () => {
    const validDigits = new Set<string>(CALCULATOR_DIGITS);
    const configuredDigits = calculatorButtonConfig
      .filter((button) => button.action.type === "digit")
      .map((button) => (button.action.type === "digit" ? button.action.digit : undefined));

    expect(configuredDigits.every((digit) => digit !== undefined && validDigits.has(digit))).toBe(true);
    expect(new Set(configuredDigits)).toEqual(validDigits);
  });

  it("supports wider responsive layout treatment for a utility or digit key", () => {
    const utilityOrDigitButtons = calculatorButtonConfig.filter(
      (button) => button.action.type === "clear" || button.action.type === "digit",
    );

    expect(utilityOrDigitButtons.some((button) => hasWiderGridSpan(button.gridSpan))).toBe(true);
  });
});
