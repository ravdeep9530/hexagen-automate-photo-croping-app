import { describe, expect, it } from 'vitest';
import type { CalculatorShellController } from '../../components/calculator/calculator-shell';
// @ts-ignore TS6142: App Router pages use .tsx in Next.js, while this lightweight package tsconfig does not enable JSX.
import CalculatorPage, { metadata } from './page';
import {
  CALCULATOR_ROUTE_PATH,
  calculatorPageMetadata,
  calculatorPageShellOptions,
} from './page-config';

describe('/calculator App Router page', () => {
  it('exports Next.js metadata for the additive calculator route', () => {
    expect(metadata).toBe(calculatorPageMetadata);
    expect(metadata.title).toBe('Calculator');
    expect(metadata.description.includes('calculator')).toBe(true);
    expect(metadata.alternates.canonical).toBe(CALCULATOR_ROUTE_PATH);
  });

  it('renders the CalculatorShell client shell contract for GET /calculator', () => {
    const page = CalculatorPage();

    expect(page.model.props.dataCalculatorShell).toBe(true);
    expect(page.model.props.dataClientComponent).toBe(true);
    expect(page.model.components).toEqual([
      'CalculatorDisplay',
      'CalculatorKeypad',
      'HistoryPanel',
      'ThemeToggle',
    ]);
    expect(page.model.display.result).toBe('0');
    expect(page.model.classes.root.includes('min-h-screen')).toBe(true);
  });

  it('uses server-safe shell options that avoid browser-only APIs during render', () => {
    expect(calculatorPageShellOptions.keyboardEnabled).toBe(false);
    expect(calculatorPageShellOptions.keyboard?.enabled).toBe(false);
    expect(calculatorPageShellOptions.keyboard?.target).toBe(null);
    expect(calculatorPageShellOptions.mounted).toBe(false);

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { document?: unknown }).document;

    try {
      const page = CalculatorPage();

      expect(page.model.historyEntries).toEqual([]);
      expect(page.model.themeToggle.mounted).toBe(false);
      expect(page.model.themeToggle.resolvedTheme).toBe(null);
    } finally {
      restoreGlobal('window', originalWindow);
      restoreGlobal('document', originalDocument);
    }
  });

  it('allows an injected shell for framework adapters without rebuilding unrelated routes', () => {
    const shell = createStubShell();

    expect(CalculatorPage({ shell })).toBe(shell);
  });
});

function createStubShell(): CalculatorShellController {
  const shell = CalculatorPage();
  return shell;
}

function restoreGlobal(name: 'window' | 'document', value: unknown): void {
  if (value === undefined) {
    delete (globalThis as Record<typeof name, unknown>)[name];
    return;
  }

  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}
