import { describe, expect, it } from 'vitest';
import {
  createCalculatorThemeToggleModel,
  getSupportedCalculatorThemes,
  resolveCalculatorTheme,
  setCalculatorTheme,
  toggleCalculatorTheme,
} from './theme-toggle';
import type { NextThemesLikeController } from './theme-toggle';

function createController(overrides: Partial<NextThemesLikeController> = {}) {
  const calls: string[] = [];
  const controller: NextThemesLikeController = {
    theme: 'light',
    resolvedTheme: 'light',
    systemTheme: 'dark',
    themes: ['light', 'dark', 'system'],
    setTheme(theme: string) {
      calls.push(theme);
      controller.theme = theme;
    },
    ...overrides,
  };

  return { controller, calls };
}

describe('calculator theme toggle model', () => {
  it('reads next-themes state and exposes accessible radio controls', () => {
    const { controller } = createController({
      theme: 'system',
      resolvedTheme: 'dark',
    });

    const model = createCalculatorThemeToggleModel(controller, true);

    expect(model.selectedTheme).toBe('system');
    expect(model.resolvedTheme).toBe('dark');
    expect(model.supportsSystem).toBe(true);
    expect(model.groupProps.role).toBe('radiogroup');
    expect(model.groupProps.ariaLabel).toBe('Calculator theme');
    expect(model.statusText).toBe('System (dark)');
    expect(model.toggleAriaLabel).toBe('Calculator theme: System (dark)');

    const selected = model.options.find((option) => option.value === 'system');
    expect(selected?.isSelected).toBe(true);
    expect(selected?.controlProps.role).toBe('radio');
    expect(selected?.controlProps.type).toBe('button');
    expect(selected?.controlProps.ariaChecked).toBe(true);
    expect(selected?.controlProps.ariaLabel).toBe('Use system calculator theme');
    expect(selected?.controlProps.tabIndex).toBe(0);
  });

  it('defers resolved-theme-specific UI until mounted', () => {
    const { controller } = createController({
      theme: 'system',
      resolvedTheme: 'dark',
    });

    const model = createCalculatorThemeToggleModel(controller, false);

    expect(model.mounted).toBe(false);
    expect(model.selectedTheme).toBe('system');
    expect(model.resolvedTheme).toBe(null);
    expect(model.statusText).toBe('Theme controls loading');
    expect(model.toggleAriaLabel).toBe('Calculator theme controls');
  });

  it('supports light and dark only when the provider does not expose system support', () => {
    const { controller } = createController({
      theme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: undefined,
    });

    expect(getSupportedCalculatorThemes(controller)).toEqual(['light', 'dark']);

    const model = createCalculatorThemeToggleModel(controller, true);
    expect(model.supportsSystem).toBe(false);
    expect(model.options.map((option) => option.value)).toEqual(['light', 'dark']);
  });

  it('cycles through provider-supported themes and updates via setTheme', () => {
    const { controller, calls } = createController({ theme: 'light' });

    expect(toggleCalculatorTheme(controller)).toBe('dark');
    expect(toggleCalculatorTheme(controller)).toBe('system');
    expect(toggleCalculatorTheme(controller)).toBe('light');
    expect(calls).toEqual(['dark', 'system', 'light']);
  });

  it('rejects unsupported system updates for light/dark-only providers', () => {
    const { controller, calls } = createController({
      themes: ['light', 'dark'],
      systemTheme: undefined,
    });

    expect(setCalculatorTheme(controller, 'system')).toBe(false);
    expect(calls).toEqual([]);

    expect(setCalculatorTheme(controller, 'dark')).toBe(true);
    expect(calls).toEqual(['dark']);
  });

  it('uses next-themes resolvedTheme before falling back to systemTheme or theme', () => {
    expect(
      resolveCalculatorTheme({ theme: 'system', resolvedTheme: 'dark', systemTheme: 'light' }),
    ).toBe('dark');
    expect(
      resolveCalculatorTheme({ theme: 'system', resolvedTheme: undefined, systemTheme: 'light' }),
    ).toBe('light');
    expect(
      resolveCalculatorTheme({ theme: 'dark', resolvedTheme: undefined, systemTheme: undefined }),
    ).toBe('dark');
    expect(
      resolveCalculatorTheme({ theme: undefined, resolvedTheme: undefined, systemTheme: undefined }),
    ).toBe('light');
  });

  it('exports Tailwind dark-class glassmorphism styling tokens', () => {
    const { controller } = createController();
    const model = createCalculatorThemeToggleModel(controller, true);

    expect(model.classes.root.includes('backdrop-blur')).toBe(true);
    expect(model.classes.root.includes('dark:')).toBe(true);
    expect(model.classes.option.includes('focus-visible:ring')).toBe(true);
    expect(model.classes.optionActive.includes('dark:bg')).toBe(true);
  });
});
