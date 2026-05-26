import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

import { Calculator } from '../Calculator';

type AccessibleName = RegExp | string;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function digitName(digit: number | string): string {
  return `Digit ${digit}`;
}

export function getCalculatorDisplay(): HTMLElement {
  return screen.getByRole('status', { name: /calculator display/i });
}

export function getCalculatorButton(name: AccessibleName): HTMLElement {
  return screen.getByRole('button', { name });
}

export function renderCalculator() {
  const user = userEvent.setup();
  render(<Calculator />);

  return {
    user,
    display: getCalculatorDisplay,
    button: getCalculatorButton,
  };
}

export async function press(user: UserEvent, names: AccessibleName[]): Promise<void> {
  for (const name of names) {
    await user.click(getCalculatorButton(name));
  }
}

export function expectDisplayToShow(expected: string): void {
  expect(getCalculatorDisplay()).toHaveTextContent(new RegExp(`^${escapeRegExp(expected)}$`));
}
