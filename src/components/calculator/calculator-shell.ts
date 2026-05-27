'use client';

import { calculatorButtons } from '../../features/calculator/button-config';
import type {
  CalculatorAction,
  CalculatorDispatch,
  CalculatorHistoryController,
  HistoryEntry,
} from '../../features/calculator/types';
import {
  type CalculatorController,
  type UseCalculatorOptions,
  useCalculator,
} from '../../features/calculator/use-calculator';
import {
  type UseCalculatorKeyboardOptions,
  useCalculatorKeyboard,
} from '../../features/calculator/use-calculator-keyboard';
import { cn } from '../../lib/utils';
import {
  createCalculatorDisplayViewModel,
  type CalculatorDisplayViewModel,
} from './calculator-display';
import {
  createCalculatorKeypadInteractionHandlers,
  createCalculatorKeypadViewModel,
  type CalculatorKeypadViewModel,
} from './calculator-keypad';
import {
  createHistoryPanelControllerHandlers,
  createHistoryPanelViewModel,
  type CreateHistoryPanelViewModelOptions,
  type HistoryPanelInteractionHandlers,
  type HistoryPanelViewModel,
} from './history-panel';
import {
  createCalculatorThemeToggleModel,
  setCalculatorTheme,
  toggleCalculatorTheme,
  type CalculatorTheme,
  type NextThemesLikeController,
  type ThemeToggleModel,
} from './theme-toggle';

export type CalculatorShellRenderedComponent =
  | 'CalculatorDisplay'
  | 'CalculatorKeypad'
  | 'HistoryPanel'
  | 'ThemeToggle';

export interface CalculatorShellMotionTransition {
  readonly duration: number;
  readonly ease: readonly [number, number, number, number];
}

export interface CalculatorShellMotionState {
  readonly opacity: number;
  readonly y?: number;
  readonly scale?: number;
}

export interface CalculatorShellMotionConfig {
  readonly reducedMotion: boolean;
  readonly initial: CalculatorShellMotionState;
  readonly animate: CalculatorShellMotionState;
  readonly transition: CalculatorShellMotionTransition;
}

export interface CalculatorShellSectionViewModel {
  readonly component: CalculatorShellRenderedComponent;
  readonly className: string;
  readonly motion: CalculatorShellMotionConfig;
}

export interface CalculatorShellClasses {
  readonly root: string;
  readonly background: string;
  readonly container: string;
  readonly header: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly toolbar: string;
  readonly layout: string;
  readonly calculatorCard: string;
  readonly calculatorStack: string;
  readonly historyColumn: string;
  readonly footerHint: string;
}

export interface CalculatorShellHandlers {
  readonly dispatch: CalculatorDispatch;
  readonly pressKeypadButton: (buttonId: string) => CalculatorAction | null;
  readonly restoreHistoryEntry: (entryId: string) => CalculatorAction | null;
  readonly clearHistory: () => readonly HistoryEntry[];
  readonly setTheme: (theme: CalculatorTheme) => boolean;
  readonly toggleTheme: () => CalculatorTheme;
}

export interface CalculatorShellViewModel {
  readonly components: readonly CalculatorShellRenderedComponent[];
  readonly display: CalculatorDisplayViewModel;
  readonly keypad: CalculatorKeypadViewModel;
  readonly historyPanel: HistoryPanelViewModel;
  readonly themeToggle: ThemeToggleModel;
  readonly historyEntries: readonly HistoryEntry[];
  readonly handlers: CalculatorShellHandlers;
  readonly sections: {
    readonly display: CalculatorShellSectionViewModel;
    readonly keypad: CalculatorShellSectionViewModel;
    readonly history: CalculatorShellSectionViewModel;
    readonly theme: CalculatorShellSectionViewModel;
  };
  readonly classes: CalculatorShellClasses;
  readonly props: {
    readonly role: 'application';
    readonly ariaLabel: 'Calculator';
    readonly dataCalculatorShell: true;
    readonly dataClientComponent: true;
  };
  readonly motion: CalculatorShellMotionConfig;
}

export interface CalculatorShellController {
  readonly calculator: CalculatorController;
  readonly themeController: NextThemesLikeController;
  readonly mounted: boolean;
  readonly model: CalculatorShellViewModel;
  readonly historyHandlers: HistoryPanelInteractionHandlers;
  dispatch(action: CalculatorAction): void;
  pressKeypadButton(buttonId: string): CalculatorAction | null;
  restoreHistoryEntry(entryId: string): CalculatorAction | null;
  clearHistory(): readonly HistoryEntry[];
  setTheme(theme: CalculatorTheme): boolean;
  toggleTheme(): CalculatorTheme;
}

export interface CreateCalculatorShellViewModelOptions {
  className?: string;
  compactKeypad?: boolean;
  mounted?: boolean;
  reducedMotion?: boolean;
  history?: CreateHistoryPanelViewModelOptions;
  themeController?: NextThemesLikeController;
}

export interface UseCalculatorShellOptions extends UseCalculatorOptions {
  className?: string;
  compactKeypad?: boolean;
  keyboard?: UseCalculatorKeyboardOptions;
  keyboardEnabled?: boolean;
  mounted?: boolean;
  reducedMotion?: boolean;
  history?: CreateHistoryPanelViewModelOptions;
  themeController?: NextThemesLikeController;
}

const standardEase: readonly [number, number, number, number] = [0.16, 1, 0.3, 1];

export const calculatorShellRenderedComponents: readonly CalculatorShellRenderedComponent[] = Object.freeze([
  'CalculatorDisplay',
  'CalculatorKeypad',
  'HistoryPanel',
  'ThemeToggle',
]);

export const calculatorShellMotion: CalculatorShellMotionConfig = Object.freeze({
  reducedMotion: false,
  initial: Object.freeze({ opacity: 0, y: 10, scale: 0.99 }),
  animate: Object.freeze({ opacity: 1, y: 0, scale: 1 }),
  transition: Object.freeze({ duration: 0.22, ease: standardEase }),
});

export const calculatorShellSectionMotion: CalculatorShellMotionConfig = Object.freeze({
  reducedMotion: false,
  initial: Object.freeze({ opacity: 0, y: 8 }),
  animate: Object.freeze({ opacity: 1, y: 0 }),
  transition: Object.freeze({ duration: 0.18, ease: standardEase }),
});

export const calculatorShellReducedMotion: CalculatorShellMotionConfig = Object.freeze({
  reducedMotion: true,
  initial: Object.freeze({ opacity: 1, y: 0, scale: 1 }),
  animate: Object.freeze({ opacity: 1, y: 0, scale: 1 }),
  transition: Object.freeze({ duration: 0, ease: standardEase }),
});

export const calculatorShellClasses: CalculatorShellClasses = Object.freeze({
  root: [
    'relative isolate min-h-screen overflow-x-hidden bg-slate-100 px-3 py-5 text-slate-950',
    'transition-colors duration-300 motion-reduce:transition-none sm:px-6 sm:py-10 lg:px-8',
    'dark:bg-slate-950 dark:text-white',
  ].join(' '),
  background: [
    'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
    'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_34rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.20),transparent_30rem)]',
    'before:absolute before:left-1/2 before:top-10 before:h-72 before:w-72 before:-translate-x-1/2 before:rounded-full before:bg-fuchsia-300/20 before:blur-3xl motion-reduce:before:transform-none',
    'dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_34rem),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.14),transparent_30rem)]',
    'dark:before:bg-indigo-500/10',
  ].join(' '),
  container: 'mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-5 sm:gap-8',
  header: 'flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
  eyebrow: 'text-sm font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-200',
  title: 'mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white',
  description: 'mt-3 max-w-2xl text-base leading-7 text-slate-700 dark:text-slate-200',
  toolbar: 'flex min-w-0 shrink-0 items-center justify-start sm:justify-end',
  layout: 'grid w-full min-w-0 grid-cols-1 items-start gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]',
  calculatorCard: [
    'w-full min-w-0 max-w-full rounded-[1.5rem] border border-white/50 bg-white/70 p-2.5',
    'shadow-2xl shadow-slate-900/10 backdrop-blur-2xl sm:rounded-[2rem] sm:p-4 lg:p-5',
    'dark:border-white/10 dark:bg-slate-950/55 dark:shadow-black/30',
  ].join(' '),
  calculatorStack: 'flex min-w-0 max-w-full flex-col gap-3 sm:gap-4',
  historyColumn: 'min-w-0 max-w-full lg:sticky lg:top-6',
  footerHint: 'text-center text-xs font-medium text-slate-600 dark:text-slate-300',
});

/**
 * Composes the full client calculator shell render contract from the feature
 * hooks and component view models. A React/Next client component can render this
 * model with motion.section wrappers and pass handlers directly to buttons.
 */
export function createCalculatorShellViewModel(
  calculator: Pick<CalculatorController, 'state' | 'history' | 'dispatch' | 'clearHistory'>,
  options: CreateCalculatorShellViewModelOptions = {},
): CalculatorShellViewModel {
  const themeController = options.themeController ?? createCalculatorShellThemeController();
  const historyHandlers = createHistoryPanelControllerHandlers(calculator, calculator.dispatch);
  const keypadHandlers = createCalculatorKeypadInteractionHandlers(calculator.dispatch, calculatorButtons);
  const reducedMotion = options.reducedMotion ?? false;

  return {
    components: calculatorShellRenderedComponents,
    display: createCalculatorDisplayViewModel(calculator.state),
    keypad: createCalculatorKeypadViewModel({
      compact: options.compactKeypad,
      reducedMotion,
    }),
    historyPanel: createHistoryPanelViewModel(calculator.history, {
      ...options.history,
      reducedMotion: options.history?.reducedMotion ?? reducedMotion,
    }),
    themeToggle: createCalculatorThemeToggleModel(themeController, options.mounted ?? true),
    historyEntries: calculator.history,
    handlers: {
      dispatch: calculator.dispatch,
      pressKeypadButton(buttonId: string) {
        return keypadHandlers.get(buttonId)?.() ?? null;
      },
      restoreHistoryEntry(entryId: string) {
        return historyHandlers.selectEntry(entryId);
      },
      clearHistory() {
        return historyHandlers.clearHistory();
      },
      setTheme(theme: CalculatorTheme) {
        return setCalculatorTheme(themeController, theme);
      },
      toggleTheme() {
        return toggleCalculatorTheme(themeController);
      },
    },
    sections: createCalculatorShellSections(reducedMotion),
    classes: {
      ...calculatorShellClasses,
      root: cn(calculatorShellClasses.root, options.className),
    },
    props: {
      role: 'application',
      ariaLabel: 'Calculator',
      dataCalculatorShell: true,
      dataClientComponent: true,
    },
    motion: reducedMotion ? calculatorShellReducedMotion : calculatorShellMotion,
  };
}

/**
 * Initializes calculator state, keyboard support, history persistence, and theme
 * coordination for the main shell. Storage access remains behind the calculator
 * history controller, so unavailable localStorage falls back to in-memory state.
 */
export function useCalculatorShell(options: UseCalculatorShellOptions = {}): CalculatorShellController {
  const calculator = useCalculator(options);
  const themeController = options.themeController ?? createCalculatorShellThemeController();
  const keyboardOptions: UseCalculatorKeyboardOptions = {
    ...options.keyboard,
    enabled: options.keyboardEnabled ?? options.keyboard?.enabled ?? true,
  };
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();

  useCalculatorKeyboard(calculator.dispatch, keyboardOptions);

  const controller: CalculatorShellController = {
    calculator,
    themeController,
    mounted: options.mounted ?? true,
    get model() {
      return createCalculatorShellViewModel(calculator, {
        className: options.className,
        compactKeypad: options.compactKeypad,
        mounted: controller.mounted,
        reducedMotion,
        history: options.history,
        themeController,
      });
    },
    get historyHandlers() {
      return createHistoryPanelControllerHandlers(calculator, calculator.dispatch);
    },
    dispatch(action: CalculatorAction) {
      calculator.dispatch(action);
    },
    pressKeypadButton(buttonId: string) {
      return this.model.handlers.pressKeypadButton(buttonId);
    },
    restoreHistoryEntry(entryId: string) {
      return this.historyHandlers.selectEntry(entryId);
    },
    clearHistory() {
      return calculator.clearHistory();
    },
    setTheme(theme: CalculatorTheme) {
      return setCalculatorTheme(themeController, theme);
    },
    toggleTheme() {
      return toggleCalculatorTheme(themeController);
    },
  };

  return controller;
}

/**
 * Named shell entry point for framework adapters. In this repository the shell
 * is represented as a client-side controller/view-model contract rather than a
 * React dependency, but the function performs the same composition work a Next
 * client component would perform.
 */
export function CalculatorShell(options: UseCalculatorShellOptions = {}): CalculatorShellController {
  return useCalculatorShell(options);
}

export function createCalculatorShellThemeController(
  initialTheme: CalculatorTheme = 'system',
): NextThemesLikeController {
  let theme: CalculatorTheme = initialTheme;

  const controller: NextThemesLikeController = {
    get theme() {
      return theme;
    },
    get resolvedTheme() {
      return resolveShellTheme(theme);
    },
    get systemTheme() {
      return resolveSystemTheme();
    },
    themes: ['light', 'dark', 'system'],
    setTheme(nextTheme: string) {
      if (nextTheme !== 'light' && nextTheme !== 'dark' && nextTheme !== 'system') {
        return;
      }

      theme = nextTheme;
      applyShellThemeToDocument(resolveShellTheme(theme));
    },
  };

  return controller;
}

function createCalculatorShellSections(reducedMotion = false): CalculatorShellViewModel['sections'] {
  const motion = reducedMotion ? calculatorShellReducedMotion : calculatorShellSectionMotion;

  return {
    display: {
      component: 'CalculatorDisplay',
      className: 'min-w-0 max-w-full',
      motion,
    },
    keypad: {
      component: 'CalculatorKeypad',
      className: 'min-w-0 max-w-full',
      motion,
    },
    history: {
      component: 'HistoryPanel',
      className: calculatorShellClasses.historyColumn,
      motion,
    },
    theme: {
      component: 'ThemeToggle',
      className: calculatorShellClasses.toolbar,
      motion,
    },
  };
}

function resolveShellTheme(theme: CalculatorTheme): 'light' | 'dark' {
  if (theme === 'system') {
    return resolveSystemTheme();
  }

  return theme;
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyShellThemeToDocument(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
