'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface CalculatorDisplayProps {
  displayValue: string;
  error: string | null;
}

export function CalculatorDisplay({ displayValue, error }: CalculatorDisplayProps) {
  const displayText = error ?? displayValue;

  return (
    <Paper
      aria-label="Calculator display"
      role="status"
      aria-live="polite"
      data-testid="calculator-display"
      elevation={0}
      sx={{
        bgcolor: 'grey.950',
        color: error ? 'error.light' : 'common.white',
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        minHeight: { xs: 96, sm: 116 },
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <Typography
          component="output"
          sx={{
            display: 'block',
            fontVariantNumeric: 'tabular-nums',
            fontSize: { xs: '2.6rem', sm: '3.5rem' },
            fontWeight: 500,
            lineHeight: 1.05,
            overflowWrap: 'anywhere',
            textAlign: 'right',
          }}
        >
          {displayText}
        </Typography>
      </Box>
    </Paper>
  );
}
