import { describe, expect, it } from 'vitest';
import { calculatorButtons } from '../../features/calculator/button-config';
import { createCalculatorButtonViewModel } from './calculator-button';
import { createCalculatorDisplayViewModel } from './calculator-display';
import { createCalculatorKeypadViewModel } from './calculator-keypad';
import {
  createCalculatorShellViewModel,
  useCalculatorShell,
} from './calculator-shell';
import { createHistoryPanelViewModel } from './history-panel';
import { createCalculatorThemeToggleModel } from './theme-toggle';

describe('calculator responsive styling and accessibility states', () => {
  it('keeps shell, card, display, keypad, and history constrained to avoid horizontal overflow', () => {
    const shell = createCalculatorShellViewModel({
      state: {
        display: '1234567890',
        storedValue: null,
        operator: null,
        expression: '1 + 2 =',
        status: 'result',
        shouldOverwriteDisplay: false,
      },
      history: [],
      dispatch: () => undefined,
      clearHistory: () => [],
    });
    const keypad = createCalculatorKeypadViewModel();
    const display = createCalculatorDisplayViewModel({
      expression: '1 + 2 =',
      display: '3',
      status: 'result',
    });
    const history = createHistoryPanelViewModel([]);

    expect(shell.classes.root.includes('overflow-x-hidden')).toBe(true);
    expect(shell.classes.container.includes('min-w-0')).toBe(true);
    expect(shell.classes.layout.includes('min-w-0')).toBe(true);
    expect(shell.classes.layout.includes('overflow-hidden')).toBe(true);
    expect(shell.classes.calculatorCard.includes('max-w-full')).toBe(true);
    expect(shell.classes.calculatorCard.includes('sm:rounded-[2rem]')).toBe(true);
    expect(display.rootClassName.includes('max-w-full')).toBe(true);
    expect(display.resultClassName.includes('truncate')).toBe(true);
    expect(keypad.className.includes('min-w-0')).toBe(true);
    expect(keypad.className.includes('[&>button]:max-w-full')).toBe(true);
    expect(history.className.includes('max-w-full')).toBe(true);
    expect(history.listClassName.includes('overflow-x-hidden')).toBe(true);
  });

  it('provides high-visibility focus rings for every interactive calculator control', () => {
    for (const config of calculatorButtons) {
      const button = createCalculatorButtonViewModel(config);

      expect(button.className.includes('focus-visible:ring-4')).toBe(true);
      expect(button.className.includes('focus-visible:ring-offset-white')).toBe(true);
      expect(button.className.includes('dark:focus-visible:ring-offset-slate-950')).toBe(true);
    }

    const panel = createHistoryPanelViewModel([
      {
        id: 'history-1',
        expression: '2 + 2 =',
        result: '4',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ]);
    const theme = createCalculatorThemeToggleModel(
      {
        theme: 'light',
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        setTheme: () => undefined,
      },
      true,
    );

    expect(panel.entries[0].className.includes('focus-visible:ring-4')).toBe(true);
    expect(panel.clearButton.className.includes('focus-visible:ring-4')).toBe(true);
    expect(theme.classes.option.includes('focus-visible:ring-4')).toBe(true);
  });

  it('uses contrast-conscious light and dark text tokens for readable states', () => {
    const display = createCalculatorDisplayViewModel({
      expression: '9 ÷ 0 =',
      display: 'Cannot divide by zero',
      status: 'error',
    });
    const panel = createHistoryPanelViewModel([]);
    const theme = createCalculatorThemeToggleModel(
      {
        theme: 'dark',
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        setTheme: () => undefined,
      },
      true,
    );

    expect(display.expressionClassName.includes('text-slate-600')).toBe(true);
    expect(display.expressionClassName.includes('dark:text-slate-300')).toBe(true);
    expect(display.resultClassName.includes('text-rose-800')).toBe(true);
    expect(display.resultClassName.includes('dark:text-rose-100')).toBe(true);
    expect(panel.emptyState.className.includes('text-slate-700')).toBe(true);
    expect(panel.emptyState.className.includes('dark:text-slate-200')).toBe(true);
    expect(theme.classes.optionInactive.includes('text-slate-700')).toBe(true);
    expect(theme.classes.optionInactive.includes('dark:text-slate-200')).toBe(true);
  });

  it('exposes reduced-motion-safe class tokens and motion models', () => {
    const shell = useCalculatorShell({
      keyboard: { target: null },
      reducedMotion: true,
    });
    const model = shell.model;

    expect(model.motion.reducedMotion).toBe(true);
    expect(model.motion.transition.duration).toBe(0);
    expect(model.motion.initial).toEqual({ opacity: 1, y: 0, scale: 1 });
    expect(model.sections.keypad.motion.reducedMotion).toBe(true);
    expect(model.keypad.buttons[0].motion.reducedMotion).toBe(true);
    expect(model.keypad.buttons[0].motion.whileTap).toEqual({ scale: 1, y: 0 });
    expect(model.historyPanel.motion.reducedMotion).toBe(true);
    expect(model.historyPanel.motion.transition.duration).toBe(0);
    expect(model.classes.root.includes('motion-reduce:transition-none')).toBe(true);
    expect(model.themeToggle.classes.option.includes('motion-reduce:transition-none')).toBe(true);
  });
});
