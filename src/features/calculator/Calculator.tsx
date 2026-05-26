'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { CalculatorDisplay } from './CalculatorDisplay';
import { CalculatorKeypad } from './CalculatorKeypad';
import { useCalculator } from './useCalculator';

export default function Calculator() {
  const { state, dispatch } = useCalculator();

  return (
    <Container
      component="main"
      maxWidth="sm"
      disableGutters
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: { xs: 2, sm: 4 },
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Paper
        elevation={8}
        role="group"
        aria-label="Calculator"
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: 4, sm: 5 },
          bgcolor: 'background.paper',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          <Typography
            component="h1"
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', px: 0.5 }}
          >
            Calculator
          </Typography>
          <CalculatorDisplay displayValue={state.displayValue} error={state.error} />
          <CalculatorKeypad dispatch={dispatch} />
        </Box>
      </Paper>
    </Container>
  );
}
