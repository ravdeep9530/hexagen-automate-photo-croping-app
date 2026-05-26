import type { CalculationResult } from './types';

export const ERROR_DISPLAY = 'Error';
export const INVALID_NUMBER_ERROR = 'Invalid number';

const MAX_SIGNIFICANT_DIGITS = 15;
const MAX_FIXED_FRACTION_DIGITS = 12;
const EXPONENTIAL_UPPER_BOUND = 1_000_000_000_000_000;
const EXPONENTIAL_LOWER_BOUND = 0.000000001;

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeCalculatorNumber(value: number): number {
  if (Object.is(value, -0)) {
    return 0;
  }

  if (Number.isInteger(value)) {
    return value;
  }

  const normalized = Number(value.toPrecision(MAX_SIGNIFICANT_DIGITS));
  return Object.is(normalized, -0) ? 0 : normalized;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
}

function trimExponential(value: string): string {
  const [mantissa, exponent] = value.split('e');
  const normalizedExponent = exponent.startsWith('+') ? exponent.slice(1) : exponent;
  return `${trimTrailingZeros(mantissa)}e${normalizedExponent}`;
}

export function formatCalculatorValue(value: number): string {
  if (!isFiniteNumber(value)) {
    return ERROR_DISPLAY;
  }

  const normalized = normalizeCalculatorNumber(value);

  if (Number.isInteger(normalized)) {
    return String(normalized);
  }

  const absoluteValue = Math.abs(normalized);
  if (absoluteValue >= EXPONENTIAL_UPPER_BOUND || (absoluteValue > 0 && absoluteValue < EXPONENTIAL_LOWER_BOUND)) {
    return trimExponential(normalized.toExponential(MAX_FIXED_FRACTION_DIGITS));
  }

  return trimTrailingZeros(normalized.toFixed(MAX_FIXED_FRACTION_DIGITS));
}

export function formatCalculationResult(value: unknown): CalculationResult {
  if (!isFiniteNumber(value)) {
    return {
      value: null,
      display: ERROR_DISPLAY,
      error: INVALID_NUMBER_ERROR,
    };
  }

  const normalized = normalizeCalculatorNumber(value);
  if (!isFiniteNumber(normalized)) {
    return {
      value: null,
      display: ERROR_DISPLAY,
      error: INVALID_NUMBER_ERROR,
    };
  }

  return {
    value: normalized,
    display: formatCalculatorValue(normalized),
    error: null,
  };
}
