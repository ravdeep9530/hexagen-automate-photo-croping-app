import { cn } from '../../lib/utils';
import type {
  CalculatorAction,
  CalculatorButtonConfig,
  CalculatorButtonKind,
} from '../../features/calculator/types';

export type CalculatorButtonVariant = CalculatorButtonKind;

export interface MotionPressFeedback {
  readonly reducedMotion: boolean;
  readonly whileTap: {
    readonly scale: number;
    readonly y: number;
  };
  readonly transition: {
    readonly type: 'spring';
    readonly stiffness: number;
    readonly damping: number;
    readonly mass: number;
  };
}

export interface CalculatorButtonViewModel {
  readonly id: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly variant: CalculatorButtonVariant;
  readonly className: string;
  readonly action: CalculatorAction;
  readonly buttonProps: {
    readonly type: 'button';
    readonly ariaLabel: string;
    readonly dataCalculatorButton: string;
    readonly dataVariant: CalculatorButtonVariant;
  };
  readonly motion: MotionPressFeedback;
}

export interface CreateCalculatorButtonViewModelOptions {
  className?: string;
  compact?: boolean;
  reducedMotion?: boolean;
}

const baseButtonClasses = [
  'relative inline-flex min-h-14 min-w-0 w-full touch-manipulation select-none items-center justify-center overflow-hidden rounded-2xl',
  'border text-lg font-semibold tabular-nums shadow-lg backdrop-blur-xl',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:shadow-md sm:min-h-16 sm:text-xl',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/80',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-300/90 dark:focus-visible:ring-offset-slate-950',
  'motion-reduce:transform-none motion-reduce:transition-none',
  'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

const compactButtonClasses = 'min-h-12 rounded-xl text-base sm:min-h-14 sm:text-lg';

export const calculatorButtonVariantClasses: Record<CalculatorButtonVariant, string> = Object.freeze({
  digit: [
    'border-white/60 bg-white/75 text-slate-950 shadow-slate-900/10',
    'hover:bg-white/90 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-50',
    'dark:shadow-black/25 dark:hover:bg-slate-700/85',
  ].join(' '),
  decimal: [
    'border-sky-200/80 bg-sky-50/90 text-sky-950 shadow-sky-900/10',
    'hover:bg-sky-100/95 dark:border-sky-300/20 dark:bg-sky-950/65',
    'dark:text-sky-100 dark:shadow-black/25 dark:hover:bg-sky-900/75',
  ].join(' '),
  operator: [
    'border-amber-200/80 bg-amber-100/90 text-amber-950 shadow-amber-900/10',
    'hover:bg-amber-200/90 dark:border-amber-300/20 dark:bg-amber-500/25',
    'dark:text-amber-100 dark:shadow-black/25 dark:hover:bg-amber-500/35',
  ].join(' '),
  clear: [
    'border-rose-200/80 bg-rose-100/90 text-rose-950 shadow-rose-900/10',
    'hover:bg-rose-200/95 dark:border-rose-300/20 dark:bg-rose-500/25',
    'dark:text-rose-100 dark:shadow-black/25 dark:hover:bg-rose-500/35',
  ].join(' '),
  equals: [
    'border-indigo-300/80 bg-indigo-600 text-white shadow-indigo-900/25',
    'hover:bg-indigo-500 dark:border-indigo-300/40 dark:bg-indigo-300',
    'dark:text-slate-950 dark:shadow-indigo-950/30 dark:hover:bg-indigo-200',
  ].join(' '),
});

export const calculatorButtonMotion: MotionPressFeedback = Object.freeze({
  reducedMotion: false,
  whileTap: Object.freeze({ scale: 0.96, y: 1 }),
  transition: Object.freeze({ type: 'spring', stiffness: 520, damping: 32, mass: 0.45 }),
});

export const calculatorButtonReducedMotion: MotionPressFeedback = Object.freeze({
  reducedMotion: true,
  whileTap: Object.freeze({ scale: 1, y: 0 }),
  transition: Object.freeze({ type: 'spring', stiffness: 1, damping: 100, mass: 1 }),
});

export function createCalculatorButtonViewModel(
  config: CalculatorButtonConfig,
  options: CreateCalculatorButtonViewModelOptions = {},
): CalculatorButtonViewModel {
  return {
    id: config.id,
    label: config.label,
    ariaLabel: config.ariaLabel,
    variant: config.kind,
    action: getCalculatorButtonAction(config),
    className: cn(
      baseButtonClasses,
      options.compact && compactButtonClasses,
      calculatorButtonVariantClasses[config.kind],
      options.className,
    ),
    buttonProps: {
      type: 'button',
      ariaLabel: config.ariaLabel,
      dataCalculatorButton: config.id,
      dataVariant: config.kind,
    },
    motion: options.reducedMotion ? calculatorButtonReducedMotion : calculatorButtonMotion,
  };
}

export function getCalculatorButtonAction(config: CalculatorButtonConfig): CalculatorAction {
  switch (config.kind) {
    case 'digit':
      if (!config.digit) {
        throw new Error(`Digit calculator button ${config.id} is missing a digit value`);
      }
      return { type: 'digit', digit: config.digit };
    case 'decimal':
      return { type: 'decimal' };
    case 'operator':
      if (!config.operator) {
        throw new Error(`Operator calculator button ${config.id} is missing an operator value`);
      }
      return { type: 'operator', operator: config.operator };
    case 'equals':
      return { type: 'equals' };
    case 'clear':
      return { type: 'clear' };
  }
}

/**
 * Adapter for React + Framer Motion integrations. Consumers can spread the
 * returned props onto motion.button and wire onPointerUp or onClick without any
 * async animation work blocking dispatch.
 */
export function createCalculatorButtonProps(
  config: CalculatorButtonConfig,
  dispatch: (action: CalculatorAction) => void,
  options: CreateCalculatorButtonViewModelOptions = {},
): CalculatorButtonViewModel & {
  readonly onPointerUp: () => void;
  readonly onClick: () => void;
} {
  const model = createCalculatorButtonViewModel(config, options);
  const dispatchAction = () => dispatch(model.action);

  return {
    ...model,
    onPointerUp: dispatchAction,
    onClick: dispatchAction,
  };
}
