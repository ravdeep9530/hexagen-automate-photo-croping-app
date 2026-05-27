'use client';

import { calculatorButtons } from './button-config';
import type {
  CalculatorAction,
  CalculatorButtonConfig,
  CalculatorDispatch,
} from './types';

export interface CalculatorKeyboardEventLike {
  key: string;
  repeat?: boolean;
  defaultPrevented?: boolean;
  preventDefault(): void;
}

export interface CalculatorKeyboardTarget {
  addEventListener(
    type: 'keydown',
    listener: (event: KeyboardEvent) => void,
  ): void;
  removeEventListener(
    type: 'keydown',
    listener: (event: KeyboardEvent) => void,
  ): void;
}

export interface CalculatorKeyboardSubscription {
  dispose(): void;
}

export interface UseCalculatorKeyboardOptions {
  /** Optional event target override for tests, iframes, or scoped integrations. */
  target?: CalculatorKeyboardTarget | null;
  /** Allows consumers to temporarily disable keyboard input without unmounting. */
  enabled?: boolean;
  /** Defaults to the shared calculator button configuration. */
  buttons?: readonly CalculatorButtonConfig[];
  /** Ignore held-key repeats. Defaults to false so native typing semantics work. */
  ignoreRepeat?: boolean;
}

type EffectCallback = () => void | (() => void);
type EffectHook = (effect: EffectCallback, deps?: readonly unknown[]) => void;

type ReactLike = {
  useEffect?: EffectHook;
};

const KEYBOARD_ACTIONS = createKeyboardActionMap(calculatorButtons);

/**
 * Registers a client-side keydown listener that dispatches calculator actions.
 *
 * The implementation intentionally keeps the event subscription isolated in an
 * effect and only prevents browser defaults for keys that are configured as
 * calculator shortcuts. Unsupported keys are ignored entirely.
 */
export function useCalculatorKeyboard(
  dispatch: CalculatorDispatch,
  options: UseCalculatorKeyboardOptions = {},
): void {
  const effect = resolveEffectHook();
  const {
    target,
    enabled = true,
    buttons = calculatorButtons,
    ignoreRepeat = false,
  } = options;

  effect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeCalculatorKeyboard(dispatch, {
      target,
      buttons,
      ignoreRepeat,
    }).dispose;
  }, [dispatch, enabled, target, buttons, ignoreRepeat]);
}

/**
 * Imperative subscription helper used by the hook and tests. It mirrors the
 * hook behavior without requiring a React test renderer in this lightweight
 * package.
 */
export function subscribeCalculatorKeyboard(
  dispatch: CalculatorDispatch,
  options: UseCalculatorKeyboardOptions = {},
): CalculatorKeyboardSubscription {
  const target = options.target === undefined ? getDefaultKeyboardTarget() : options.target;

  if (!target || options.enabled === false) {
    return noopSubscription;
  }

  const actions = createKeyboardActionMap(options.buttons ?? calculatorButtons);
  const ignoreRepeat = options.ignoreRepeat ?? false;
  const listener = (event: KeyboardEvent) => {
    handleCalculatorKeyboardEvent(event, dispatch, { actions, ignoreRepeat });
  };

  target.addEventListener('keydown', listener);

  return {
    dispose() {
      target.removeEventListener('keydown', listener);
    },
  };
}

export function handleCalculatorKeyboardEvent(
  event: CalculatorKeyboardEventLike,
  dispatch: CalculatorDispatch,
  options: {
    actions?: ReadonlyMap<string, KeyboardActionConfig>;
    ignoreRepeat?: boolean;
  } = {},
): boolean {
  if (event.defaultPrevented || (options.ignoreRepeat && event.repeat)) {
    return false;
  }

  const actionConfig = (options.actions ?? KEYBOARD_ACTIONS).get(event.key);

  if (!actionConfig) {
    return false;
  }

  if (actionConfig.preventDefault) {
    event.preventDefault();
  }

  dispatch(actionConfig.action);
  return true;
}

export interface KeyboardActionConfig {
  action: CalculatorAction;
  preventDefault: boolean;
}

export function createKeyboardActionMap(
  buttons: readonly CalculatorButtonConfig[] = calculatorButtons,
): ReadonlyMap<string, KeyboardActionConfig> {
  const actions = new Map<string, KeyboardActionConfig>();

  for (const button of buttons) {
    const action = getActionForButton(button);

    if (!action || !button.keyboardKeys) {
      continue;
    }

    for (const key of button.keyboardKeys) {
      actions.set(key, {
        action,
        preventDefault: button.preventDefaultOnKeyboard ?? true,
      });
    }
  }

  return actions;
}

function getActionForButton(button: CalculatorButtonConfig): CalculatorAction | null {
  switch (button.kind) {
    case 'digit':
      return button.digit ? { type: 'digit', digit: button.digit } : null;
    case 'decimal':
      return { type: 'decimal' };
    case 'operator':
      return button.operator ? { type: 'operator', operator: button.operator } : null;
    case 'equals':
      return { type: 'equals' };
    case 'clear':
      return { type: 'clear' };
  }
}

function getDefaultKeyboardTarget(): CalculatorKeyboardTarget | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}

function resolveEffectHook(): EffectHook {
  const reactLike = (globalThis as { React?: ReactLike }).React;

  if (reactLike?.useEffect) {
    return reactLike.useEffect;
  }

  return (_effect: EffectCallback) => undefined;
}

const noopSubscription: CalculatorKeyboardSubscription = Object.freeze({
  dispose() {
    // No target is available during SSR or while disabled.
  },
});
