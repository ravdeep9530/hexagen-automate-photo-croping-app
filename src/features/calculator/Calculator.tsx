'use client';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';

type Operator = 'add' | 'subtract' | 'multiply' | 'divide';

const DIVIDE_BY_ZERO_MESSAGE = 'Cannot divide by zero';

const OPERATOR_SYMBOLS: Record<Operator, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

const OPERATOR_ACCESSIBLE_NAMES: Record<Operator, string> = {
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
};

function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  return Number.parseFloat(value.toPrecision(12)).toString();
}

function calculate(left: number, right: number, operator: Operator): { display: string; value: number; error?: boolean } {
  switch (operator) {
    case 'add':
      return { display: formatResult(left + right), value: left + right };
    case 'subtract':
      return { display: formatResult(left - right), value: left - right };
    case 'multiply':
      return { display: formatResult(left * right), value: left * right };
    case 'divide':
      if (right === 0) {
        return { display: DIVIDE_BY_ZERO_MESSAGE, value: 0, error: true };
      }

      return { display: formatResult(left / right), value: left / right };
    default: {
      const exhaustiveCheck: never = operator;
      return exhaustiveCheck;
    }
  }
}

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hasError, setHasError] = useState(false);

  const clear = () => {
    setDisplay('0');
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setHasError(false);
  };

  const inputDigit = (digit: string) => {
    if (hasError) {
      setDisplay(digit);
      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(false);
      setHasError(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    setDisplay((currentDisplay) => (currentDisplay === '0' ? digit : `${currentDisplay}${digit}`));
  };

  const inputDecimal = () => {
    if (hasError) {
      setDisplay('0.');
      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(false);
      setHasError(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    setDisplay((currentDisplay) => (currentDisplay.includes('.') ? currentDisplay : `${currentDisplay}.`));
  };

  const applyOperator = (operator: Operator) => {
    if (hasError) {
      return;
    }

    const inputValue = Number.parseFloat(display);

    if (pendingOperator && storedValue !== null && !waitingForOperand) {
      const result = calculate(storedValue, inputValue, pendingOperator);
      setDisplay(result.display);

      if (result.error) {
        setStoredValue(null);
        setPendingOperator(null);
        setWaitingForOperand(true);
        setHasError(true);
        return;
      }

      setStoredValue(result.value);
    } else {
      setStoredValue(inputValue);
    }

    setPendingOperator(operator);
    setWaitingForOperand(true);
  };

  const evaluate = () => {
    if (hasError || !pendingOperator || storedValue === null || waitingForOperand) {
      return;
    }

    const result = calculate(storedValue, Number.parseFloat(display), pendingOperator);
    setDisplay(result.display);
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(true);
    setHasError(Boolean(result.error));
  };

  const digitRows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  return (
    <Paper elevation={3} sx={{ maxWidth: 360, p: 2 }}>
      <Stack spacing={2}>
        <Box
          aria-label="Calculator display"
          role="status"
          sx={{
            alignItems: 'center',
            bgcolor: 'grey.100',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            minHeight: 64,
            overflowWrap: 'anywhere',
            px: 2,
            textAlign: 'right',
          }}
        >
          <Typography component="span" variant="h4">
            {display}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button aria-label="Clear" fullWidth onClick={clear} variant="outlined">
            C
          </Button>
          <Button aria-label="Divide" fullWidth onClick={() => applyOperator('divide')} variant="outlined">
            {OPERATOR_SYMBOLS.divide}
          </Button>
          <Button aria-label="Multiply" fullWidth onClick={() => applyOperator('multiply')} variant="outlined">
            {OPERATOR_SYMBOLS.multiply}
          </Button>
        </Stack>

        {digitRows.map((row) => (
          <Stack direction="row" key={row.join('')} spacing={1}>
            {row.map((digit) => (
              <Button aria-label={`Digit ${digit}`} fullWidth key={digit} onClick={() => inputDigit(digit)} variant="contained">
                {digit}
              </Button>
            ))}
            {row[0] === '7' ? (
              <Button aria-label="Subtract" fullWidth onClick={() => applyOperator('subtract')} variant="outlined">
                {OPERATOR_SYMBOLS.subtract}
              </Button>
            ) : null}
            {row[0] === '4' ? (
              <Button aria-label="Add" fullWidth onClick={() => applyOperator('add')} variant="outlined">
                {OPERATOR_SYMBOLS.add}
              </Button>
            ) : null}
            {row[0] === '1' ? (
              <Button aria-label="Equals" fullWidth onClick={evaluate} variant="outlined">
                =
              </Button>
            ) : null}
          </Stack>
        ))}

        <Stack direction="row" spacing={1}>
          <Button aria-label="Digit 0" fullWidth onClick={() => inputDigit('0')} variant="contained">
            0
          </Button>
          <Button aria-label="Decimal point" fullWidth onClick={inputDecimal} variant="contained">
            .
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export { DIVIDE_BY_ZERO_MESSAGE, OPERATOR_ACCESSIBLE_NAMES };
export default Calculator;
