import { describe, expect, it } from 'vitest';
import { createHistoryEntry } from '../../features/calculator/storage';
import type { CalculatorHistoryController, HistoryEntry } from '../../features/calculator/types';
import {
  CalculatorShell,
  calculatorShellRenderedComponents,
  createCalculatorShellThemeController,
  createCalculatorShellViewModel,
  useCalculatorShell,
} from './calculator-shell';
import type { NextThemesLikeController } from './theme-toggle';

function createMemoryHistoryController(seed: readonly HistoryEntry[] = []): CalculatorHistoryController {
  let entries = [...seed];

  return {
    get history() {
      return entries;
    },
    addEntry(entry) {
      const historyEntry = createHistoryEntry(entry);
      entries = [historyEntry, ...entries];
      return entries;
    },
    clearHistory() {
      entries = [];
      return entries;
    },
    setHistory(nextEntries) {
      entries = nextEntries.filter(isHistoryEntry);
      return entries;
    },
  };
}

function createThemeController(): { controller: NextThemesLikeController; calls: string[] } {
  const calls: string[] = [];
  const controller: NextThemesLikeController = {
    theme: 'light',
    resolvedTheme: 'light',
    systemTheme: 'dark',
    themes: ['light', 'dark', 'system'],
    setTheme(theme: string) {
      calls.push(theme);
      controller.theme = theme;
      controller.resolvedTheme = theme === 'system' ? 'dark' : theme;
    },
  };

  return { controller, calls };
}

describe('CalculatorShell composition', () => {
  it('is exported as a client shell and renders all feature sections', () => {
    const { controller: themeController } = createThemeController();
    const shell = CalculatorShell({
      historyController: createMemoryHistoryController(),
      keyboard: { target: null },
      themeController,
    });
    const model = shell.model;

    expect(model.props.dataClientComponent).toBe(true);
    expect(model.props.dataCalculatorShell).toBe(true);
    expect(model.props.role).toBe('application');
    expect(model.components).toEqual(calculatorShellRenderedComponents);
    expect(model.components).toEqual([
      'CalculatorDisplay',
      'CalculatorKeypad',
      'HistoryPanel',
      'ThemeToggle',
    ]);
    expect(model.sections.display.component).toBe('CalculatorDisplay');
    expect(model.sections.keypad.component).toBe('CalculatorKeypad');
    expect(model.sections.history.component).toBe('HistoryPanel');
    expect(model.sections.theme.component).toBe('ThemeToggle');
  });

  it('initializes calculator state through useCalculator and keyboard support through useCalculatorKeyboard', () => {
    const target = new KeyboardTargetStub();
    const restoreReact = installImmediateReactEffect();
    const shell = useCalculatorShell({
      historyController: createMemoryHistoryController(),
      keyboard: { target },
      now: () => new Date('2024-02-03T04:05:06.789Z'),
      createId: () => 'history-1',
    });

    expect(target.addCount).toBe(1);
    expect(shell.calculator.state.display).toBe('0');

    target.keydown('7');
    target.keydown('+');
    target.keydown('8');
    target.keydown('Enter');

    expect(shell.calculator.state.display).toBe('15');
    expect(shell.calculator.history).toEqual([
      {
        id: 'history-1',
        expression: '7 + 8 =',
        result: '15',
        createdAt: '2024-02-03T04:05:06.789Z',
      },
    ]);
    expect(shell.model.historyEntries).toEqual(shell.calculator.history);

    restoreReact();
  });

  it('passes history entries and restore/clear handlers to HistoryPanel', () => {
    const entry = createHistoryEntry({
      id: 'entry-1',
      expression: '2 × 3 =',
      result: '6',
      createdAt: '2024-02-03T04:05:06.789Z',
    });
    const shell = useCalculatorShell({
      historyController: createMemoryHistoryController([entry]),
      keyboard: { target: null },
    });

    expect(shell.model.historyPanel.entries.map((historyEntry) => historyEntry.id)).toEqual(['entry-1']);
    expect(shell.restoreHistoryEntry('entry-1')).toEqual({ type: 'restore-history', entry });
    expect(shell.calculator.state.display).toBe('6');
    expect(shell.model.handlers.clearHistory()).toEqual([]);
    expect(shell.model.historyPanel.isEmpty).toBe(true);
  });

  it('exposes glassmorphism responsive layout classes and non-janky motion transitions', () => {
    const { controller: themeController } = createThemeController();
    const model = createCalculatorShellViewModel(
      {
        state: {
          display: '0',
          storedValue: null,
          operator: null,
          expression: '',
          status: 'idle',
          shouldOverwriteDisplay: false,
        },
        history: [],
        dispatch: () => undefined,
        clearHistory: () => [],
      },
      { themeController, className: 'custom-shell' },
    );

    expect(model.classes.root.includes('custom-shell')).toBe(true);
    expect(model.classes.root.includes('min-h-screen')).toBe(true);
    expect(model.classes.root.includes('dark:')).toBe(true);
    expect(model.classes.calculatorCard.includes('backdrop-blur')).toBe(true);
    expect(model.classes.calculatorCard.includes('rounded-[2rem]')).toBe(true);
    expect(model.classes.layout.includes('grid-cols-1')).toBe(true);
    expect(model.classes.layout.includes('lg:grid-cols')).toBe(true);
    expect(model.historyPanel.className.includes('lg:w-80')).toBe(true);
    expect(model.motion.transition.duration).toBe(0.22);
    expect(model.motion.initial.y).toBe(10);
    expect(model.sections.history.motion.transition.duration).toBe(0.18);
  });

  it('wires keypad and theme handlers through the shell model', () => {
    const { controller: themeController, calls } = createThemeController();
    const shell = useCalculatorShell({
      historyController: createMemoryHistoryController(),
      keyboard: { target: null },
      themeController,
    });

    expect(shell.model.handlers.pressKeypadButton('nine')).toEqual({ type: 'digit', digit: '9' });
    expect(shell.calculator.state.display).toBe('9');
    expect(shell.model.handlers.pressKeypadButton('missing')).toBe(null);

    expect(shell.setTheme('dark')).toBe(true);
    expect(shell.toggleTheme()).toBe('system');
    expect(calls).toEqual(['dark', 'system']);
  });

  it('remains usable when localStorage is unavailable', () => {
    const originalWindow = globalThis.window;
    delete (globalThis as { window?: unknown }).window;

    const shell = useCalculatorShell({
      keyboard: { target: null },
      now: () => new Date('2024-02-03T04:05:06.789Z'),
      createId: () => 'history-offline',
    });

    shell.dispatch({ type: 'digit', digit: '4' });
    shell.dispatch({ type: 'operator', operator: 'multiply' });
    shell.dispatch({ type: 'digit', digit: '5' });
    shell.dispatch({ type: 'equals' });

    expect(shell.calculator.state.display).toBe('20');
    expect(shell.calculator.history.map((entry) => entry.id)).toEqual(['history-offline']);
    expect(shell.model.display.result).toBe('20');

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it('provides a standalone theme controller compatible with the theme toggle model', () => {
    const controller = createCalculatorShellThemeController('light');

    expect(controller.theme).toBe('light');
    controller.setTheme('dark');
    expect(controller.theme).toBe('dark');
    expect(controller.resolvedTheme).toBe('dark');
    controller.setTheme('system');
    expect(controller.theme).toBe('system');
  });
});

class KeyboardTargetStub {
  readonly listeners = new Set<(event: KeyboardEvent) => void>();
  addCount = 0;

  addEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void {
    expect(type).toBe('keydown');
    this.addCount += 1;
    this.listeners.add(listener);
  }

  removeEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void {
    expect(type).toBe('keydown');
    this.listeners.delete(listener);
  }

  keydown(key: string): void {
    for (const listener of Array.from(this.listeners)) {
      listener(createKeyboardEvent(key) as unknown as KeyboardEvent);
    }
  }
}

interface TestKeyboardEvent {
  key: string;
  repeat: boolean;
  defaultPrevented: boolean;
  preventDefault(): void;
}

function createKeyboardEvent(key: string): TestKeyboardEvent {
  const event = {
    key,
    repeat: false,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };

  return event;
}

function installImmediateReactEffect(): () => void {
  const previousReact = (globalThis as { React?: unknown }).React;
  Object.defineProperty(globalThis, 'React', {
    value: {
      useEffect(effect: () => void | (() => void)) {
        effect();
      },
    },
    configurable: true,
    writable: true,
  });

  return () => {
    if (previousReact === undefined) {
      delete (globalThis as { React?: unknown }).React;
      return;
    }

    Object.defineProperty(globalThis, 'React', {
      value: previousReact,
      configurable: true,
      writable: true,
    });
  };
}

function isHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }

  const candidate = entry as Partial<HistoryEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.expression === 'string' &&
    typeof candidate.result === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}
