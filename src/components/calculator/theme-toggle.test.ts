import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

    assert.equal(model.selectedTheme, 'system');
    assert.equal(model.resolvedTheme, 'dark');
    assert.equal(model.supportsSystem, true);
    assert.equal(model.groupProps.role, 'radiogroup');
    assert.equal(model.groupProps.ariaLabel, 'Calculator theme');
    assert.equal(model.statusText, 'System (dark)');
    assert.equal(model.toggleAriaLabel, 'Calculator theme: System (dark)');

    const selected = model.options.find((option) => option.value === 'system');
    assert.equal(selected?.isSelected, true);
    assert.equal(selected?.controlProps.role, 'radio');
    assert.equal(selected?.controlProps.type, 'button');
    assert.equal(selected?.controlProps.ariaChecked, true);
    assert.equal(selected?.controlProps.ariaLabel, 'Use system calculator theme');
    assert.equal(selected?.controlProps.tabIndex, 0);
  });

  it('defers resolved-theme-specific UI until mounted', () => {
    const { controller } = createController({
      theme: 'system',
      resolvedTheme: 'dark',
    });

    const model = createCalculatorThemeToggleModel(controller, false);

    assert.equal(model.mounted, false);
    assert.equal(model.selectedTheme, 'system');
    assert.equal(model.resolvedTheme, null);
    assert.equal(model.statusText, 'Theme controls loading');
    assert.equal(model.toggleAriaLabel, 'Calculator theme controls');
  });

  it('supports light and dark only when the provider does not expose system support', () => {
    const { controller } = createController({
      theme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: undefined,
    });

    assert.deepEqual(getSupportedCalculatorThemes(controller), ['light', 'dark']);

    const model = createCalculatorThemeToggleModel(controller, true);
    assert.equal(model.supportsSystem, false);
    assert.deepEqual(
      model.options.map((option) => option.value),
      ['light', 'dark'],
    );
  });

  it('cycles through provider-supported themes and updates via setTheme', () => {
    const { controller, calls } = createController({ theme: 'light' });

    assert.equal(toggleCalculatorTheme(controller), 'dark');
    assert.equal(toggleCalculatorTheme(controller), 'system');
    assert.equal(toggleCalculatorTheme(controller), 'light');
    assert.deepEqual(calls, ['dark', 'system', 'light']);
  });

  it('rejects unsupported system updates for light/dark-only providers', () => {
    const { controller, calls } = createController({
      themes: ['light', 'dark'],
      systemTheme: undefined,
    });

    assert.equal(setCalculatorTheme(controller, 'system'), false);
    assert.deepEqual(calls, []);

    assert.equal(setCalculatorTheme(controller, 'dark'), true);
    assert.deepEqual(calls, ['dark']);
  });

  it('uses next-themes resolvedTheme before falling back to systemTheme or theme', () => {
    assert.equal(
      resolveCalculatorTheme({ theme: 'system', resolvedTheme: 'dark', systemTheme: 'light' }),
      'dark',
    );
    assert.equal(
      resolveCalculatorTheme({ theme: 'system', resolvedTheme: undefined, systemTheme: 'light' }),
      'light',
    );
    assert.equal(
      resolveCalculatorTheme({ theme: 'dark', resolvedTheme: undefined, systemTheme: undefined }),
      'dark',
    );
    assert.equal(
      resolveCalculatorTheme({ theme: undefined, resolvedTheme: undefined, systemTheme: undefined }),
      'light',
    );
  });

  it('exports Tailwind dark-class glassmorphism styling tokens', () => {
    const { controller } = createController();
    const model = createCalculatorThemeToggleModel(controller, true);

    assert.equal(model.classes.root.includes('backdrop-blur'), true);
    assert.equal(model.classes.root.includes('dark:'), true);
    assert.equal(model.classes.option.includes('focus-visible:ring'), true);
    assert.equal(model.classes.optionActive.includes('dark:bg'), true);
  });
});
