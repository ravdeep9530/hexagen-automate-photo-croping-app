import { calculatorButtons } from '../../features/calculator/button-config';
import type {
  CalculatorAction,
  CalculatorButtonConfig,
  CalculatorDispatch,
} from '../../features/calculator/types';
import { cn } from '../../lib/utils';
import {
  createCalculatorButtonViewModel,
  type CalculatorButtonViewModel,
} from './calculator-button';

export interface CalculatorKeypadButtonModel extends CalculatorButtonViewModel {
  readonly gridClassName: string;
}

export interface CalculatorKeypadViewModel {
  readonly buttons: readonly CalculatorKeypadButtonModel[];
  readonly className: string;
  readonly props: {
    readonly role: 'group';
    readonly ariaLabel: 'Calculator keypad';
  };
}

export interface CreateCalculatorKeypadOptions {
  buttons?: readonly CalculatorButtonConfig[];
  className?: string;
  compact?: boolean;
  reducedMotion?: boolean;
}

const keypadClasses = [
  'grid w-full min-w-0 grid-cols-4 gap-2 overflow-hidden sm:gap-3',
  '[&>button]:min-w-0 [&>button]:max-w-full',
].join(' ');

export function createCalculatorKeypadViewModel(
  options: CreateCalculatorKeypadOptions = {},
): CalculatorKeypadViewModel {
  const buttons = options.buttons ?? calculatorButtons;

  return {
    buttons: buttons.map((button) => ({
      ...createCalculatorButtonViewModel(button, {
        compact: options.compact,
        reducedMotion: options.reducedMotion,
      }),
      gridClassName: getCalculatorKeypadGridClass(button),
    })),
    className: cn(keypadClasses, options.className),
    props: {
      role: 'group',
      ariaLabel: 'Calculator keypad',
    },
  };
}

export function dispatchCalculatorButtonAction(
  button: CalculatorButtonConfig,
  dispatch: CalculatorDispatch,
): CalculatorAction {
  const action = createCalculatorButtonViewModel(button).action;
  dispatch(action);
  return action;
}

export function getCalculatorKeypadGridClass(button: CalculatorButtonConfig): string {
  if (button.id === 'zero') {
    return 'col-span-2';
  }

  if (button.kind === 'equals') {
    return 'row-span-2';
  }

  return '';
}

/**
 * Minimal render contract for environments that do not import React in this
 * package. A Next.js client component can map this model to motion.button:
 *
 * - use `button.buttonProps.type` for semantic buttons
 * - set `aria-label` from `button.buttonProps.ariaLabel`
 * - spread `button.motion` onto Framer Motion for press feedback
 * - call dispatch synchronously from pointer/click handlers
 */
export function createCalculatorKeypadInteractionHandlers(
  dispatch: CalculatorDispatch,
  buttons: readonly CalculatorButtonConfig[] = calculatorButtons,
): ReadonlyMap<string, () => CalculatorAction> {
  const handlers = new Map<string, () => CalculatorAction>();

  for (const button of buttons) {
    handlers.set(button.id, () => dispatchCalculatorButtonAction(button, dispatch));
  }

  return handlers;
}
