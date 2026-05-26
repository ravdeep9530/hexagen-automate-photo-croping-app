import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';

import { DIVIDE_BY_ZERO_MESSAGE } from '../Calculator';
import { digitName, expectDisplayToShow, getCalculatorButton, press, renderCalculator } from './calculatorTestUtils';

describe('Calculator component interactions', () => {
  it('renders the calculator with an initial display of 0', () => {
    renderCalculator();

    expectDisplayToShow('0');
  });

  it('updates the display in order as digit buttons are pressed', async () => {
    const { user } = renderCalculator();

    await press(user, [digitName(1), digitName(2), digitName(3), digitName(4)]);

    expectDisplayToShow('1234');
  });

  it('prevents duplicate decimal points in the active operand', async () => {
    const { user } = renderCalculator();

    await press(user, [digitName(1), 'Decimal point', digitName(2), 'Decimal point', digitName(3)]);
    expectDisplayToShow('1.23');

    await press(user, ['Clear', digitName(4), 'Add', digitName(5), 'Decimal point', digitName(6), 'Decimal point', digitName(7)]);
    expectDisplayToShow('5.67');
  });

  it.each([
    { left: 2, operator: 'Add', right: 3, expected: '5' },
    { left: 9, operator: 'Subtract', right: 4, expected: '5' },
    { left: 6, operator: 'Multiply', right: 7, expected: '42' },
    { left: 8, operator: 'Divide', right: 2, expected: '4' },
  ])('calculates $left $operator $right as $expected', async ({ left, operator, right, expected }) => {
    const { user } = renderCalculator();

    await press(user, [digitName(left), operator, digitName(right), 'Equals']);

    expectDisplayToShow(expected);
  });

  it('evaluates chained operations when operators are pressed sequentially', async () => {
    const { user } = renderCalculator();

    await press(user, [digitName(2), 'Add', digitName(3), 'Multiply']);
    expectDisplayToShow('5');

    await press(user, [digitName(4), 'Equals']);

    expectDisplayToShow('20');
  });

  it('clears the display and pending calculator state back to 0', async () => {
    const { user } = renderCalculator();

    await press(user, [digitName(9), 'Add', digitName(1), 'Clear']);
    expectDisplayToShow('0');

    await press(user, [digitName(7), 'Equals']);
    expectDisplayToShow('7');
  });

  it('displays an error message when dividing by zero', async () => {
    const { user } = renderCalculator();

    await press(user, [digitName(8), 'Divide', digitName(0), 'Equals']);

    expectDisplayToShow(DIVIDE_BY_ZERO_MESSAGE);
  });

  it('exposes controls by accessible button names used by users', () => {
    renderCalculator();

    for (const accessibleName of [
      'Clear',
      'Divide',
      'Multiply',
      'Subtract',
      'Add',
      'Equals',
      'Decimal point',
      ...Array.from({ length: 10 }, (_, digit) => digitName(digit)),
    ]) {
      expect(getCalculatorButton(accessibleName)).toBeInTheDocument();
    }
  });
});
