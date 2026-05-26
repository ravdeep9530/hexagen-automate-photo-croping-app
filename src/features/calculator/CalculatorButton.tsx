'use client';

import Button from '@mui/material/Button';

import type { CalculatorAction } from './calculatorReducer';

export type CalculatorButtonKind = 'digit' | 'operator' | 'utility' | 'equals';

export interface CalculatorButtonConfig {
  id: string;
  label: string;
  ariaLabel: string;
  kind: CalculatorButtonKind;
  action: CalculatorAction;
  gridColumn?: string;
}

interface CalculatorButtonProps {
  button: CalculatorButtonConfig;
  onPress: (action: CalculatorAction) => void;
}

const variantByKind: Record<CalculatorButtonKind, 'contained' | 'outlined'> = {
  digit: 'outlined',
  operator: 'contained',
  utility: 'contained',
  equals: 'contained',
};

const colorByKind: Record<CalculatorButtonKind, 'primary' | 'secondary' | 'warning' | 'success'> = {
  digit: 'primary',
  operator: 'warning',
  utility: 'secondary',
  equals: 'success',
};

export function CalculatorButton({ button, onPress }: CalculatorButtonProps) {
  return (
    <Button
      aria-label={button.ariaLabel}
      data-calculator-button-kind={button.kind}
      fullWidth
      variant={variantByKind[button.kind]}
      color={colorByKind[button.kind]}
      onClick={() => onPress(button.action)}
      sx={{
        gridColumn: button.gridColumn,
        minHeight: { xs: 56, sm: 64 },
        borderRadius: 3,
        fontSize: { xs: '1.2rem', sm: '1.35rem' },
        fontWeight: button.kind === 'digit' ? 500 : 700,
        lineHeight: 1,
        touchAction: 'manipulation',
        textTransform: 'none',
      }}
    >
      {button.label}
    </Button>
  );
}
