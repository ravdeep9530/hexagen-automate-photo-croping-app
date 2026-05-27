import { cn } from '../../lib/utils';
import type { CalculatorState, CalculatorStatus } from '../../features/calculator/types';

export interface CalculatorDisplayViewModel {
  readonly expression: string;
  readonly result: string;
  readonly status: CalculatorStatus;
  readonly rootClassName: string;
  readonly expressionClassName: string;
  readonly resultClassName: string;
  readonly statusText: string;
  readonly props: {
    readonly role: 'status';
    readonly ariaLive: 'polite' | 'assertive';
    readonly ariaAtomic: true;
    readonly dataStatus: CalculatorStatus;
  };
}

export interface CreateCalculatorDisplayOptions {
  className?: string;
}

const rootClasses = [
  'min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-4 text-right',
  'shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-colors duration-200 sm:p-5',
  'motion-reduce:transition-none dark:border-white/10 dark:bg-slate-950/55 dark:shadow-black/30',
].join(' ');

const expressionClasses = [
  'min-h-6 max-w-full truncate text-sm font-medium tabular-nums text-slate-600 sm:text-base',
  'dark:text-slate-300',
].join(' ');

const resultClasses = [
  'mt-1 block min-w-0 max-w-full truncate break-words text-4xl font-bold tracking-tight tabular-nums',
  'text-slate-950 sm:text-5xl dark:text-white',
].join(' ');

export const calculatorDisplayStatusClasses: Record<CalculatorStatus, string> = Object.freeze({
  idle: 'ring-1 ring-slate-200/90 dark:ring-white/10',
  editing: 'ring-2 ring-sky-400/80 dark:ring-sky-300/55',
  result: 'ring-2 ring-emerald-400/80 dark:ring-emerald-300/55',
  error: 'ring-2 ring-rose-500/90 dark:ring-rose-300/70',
});

export const calculatorDisplayResultStatusClasses: Record<CalculatorStatus, string> = Object.freeze({
  idle: 'text-slate-900 dark:text-slate-50',
  editing: 'text-sky-950 dark:text-sky-100',
  result: 'text-emerald-800 dark:text-emerald-100',
  error: 'text-rose-800 dark:text-rose-100',
});

/**
 * Creates display rendering data using plain text strings only. A React/Next UI
 * can render expression and result directly as textContent; no HTML fragments or
 * formatted markup are returned for calculator values.
 */
export function createCalculatorDisplayViewModel(
  state: Pick<CalculatorState, 'expression' | 'display' | 'status'>,
  options: CreateCalculatorDisplayOptions = {},
): CalculatorDisplayViewModel {
  const expression = state.expression || 'Ready';
  const result = state.display;

  return {
    expression,
    result,
    status: state.status,
    rootClassName: cn(rootClasses, calculatorDisplayStatusClasses[state.status], options.className),
    expressionClassName: expressionClasses,
    resultClassName: cn(resultClasses, calculatorDisplayResultStatusClasses[state.status]),
    statusText: getCalculatorDisplayStatusText(state.status),
    props: {
      role: 'status',
      ariaLive: state.status === 'error' ? 'assertive' : 'polite',
      ariaAtomic: true,
      dataStatus: state.status,
    },
  };
}

export function getCalculatorDisplayStatusText(status: CalculatorStatus): string {
  switch (status) {
    case 'idle':
      return 'Calculator is idle';
    case 'editing':
      return 'Editing expression';
    case 'result':
      return 'Showing result';
    case 'error':
      return 'Calculator error';
  }
}
