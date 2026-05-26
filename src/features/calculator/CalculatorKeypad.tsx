'use client';

import Box from '@mui/material/Box';

import { CalculatorButton, type CalculatorButtonConfig } from './CalculatorButton';
import type { CalculatorAction } from './calculatorReducer';

export const calculatorButtonConfig: CalculatorButtonConfig[] = [
  { id: 'clear', label: 'AC', ariaLabel: 'Clear calculator', kind: 'utility', action: { type: 'clear' } },
  { id: 'toggle-sign', label: '±', ariaLabel: 'Toggle sign', kind: 'utility', action: { type: 'toggleSign' } },
  { id: 'percent', label: '%', ariaLabel: 'Percent', kind: 'utility', action: { type: 'percent' } },
  { id: 'divide', label: '÷', ariaLabel: 'Divide', kind: 'operator', action: { type: 'operator', operator: 'divide' } },
  { id: 'seven', label: '7', ariaLabel: 'Seven', kind: 'digit', action: { type: 'digit', value: '7' } },
  { id: 'eight', label: '8', ariaLabel: 'Eight', kind: 'digit', action: { type: 'digit', value: '8' } },
  { id: 'nine', label: '9', ariaLabel: 'Nine', kind: 'digit', action: { type: 'digit', value: '9' } },
  { id: 'multiply', label: '×', ariaLabel: 'Multiply', kind: 'operator', action: { type: 'operator', operator: 'multiply' } },
  { id: 'four', label: '4', ariaLabel: 'Four', kind: 'digit', action: { type: 'digit', value: '4' } },
  { id: 'five', label: '5', ariaLabel: 'Five', kind: 'digit', action: { type: 'digit', value: '5' } },
  { id: 'six', label: '6', ariaLabel: 'Six', kind: 'digit', action: { type: 'digit', value: '6' } },
  { id: 'subtract', label: '−', ariaLabel: 'Subtract', kind: 'operator', action: { type: 'operator', operator: 'subtract' } },
  { id: 'one', label: '1', ariaLabel: 'One', kind: 'digit', action: { type: 'digit', value: '1' } },
  { id: 'two', label: '2', ariaLabel: 'Two', kind: 'digit', action: { type: 'digit', value: '2' } },
  { id: 'three', label: '3', ariaLabel: 'Three', kind: 'digit', action: { type: 'digit', value: '3' } },
  { id: 'add', label: '+', ariaLabel: 'Add', kind: 'operator', action: { type: 'operator', operator: 'add' } },
  { id: 'zero', label: '0', ariaLabel: 'Zero', kind: 'digit', gridColumn: 'span 2', action: { type: 'digit', value: '0' } },
  { id: 'decimal', label: '.', ariaLabel: 'Decimal point', kind: 'digit', action: { type: 'decimal' } },
  { id: 'equals', label: '=', ariaLabel: 'Equals', kind: 'equals', action: { type: 'equals' } },
];

interface CalculatorKeypadProps {
  dispatch: React.Dispatch<CalculatorAction>;
}

export function CalculatorKeypad({ dispatch }: CalculatorKeypadProps) {
  return (
    <Box
      aria-label="Calculator keypad"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: { xs: 1, sm: 1.25 },
        width: '100%',
      }}
    >
      {calculatorButtonConfig.map((button) => (
        <CalculatorButton key={button.id} button={button} onPress={dispatch} />
      ))}
    </Box>
  );
}
