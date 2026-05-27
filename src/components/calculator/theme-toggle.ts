export type CalculatorTheme = 'light' | 'dark' | 'system';
export type ResolvedCalculatorTheme = 'light' | 'dark';

export interface NextThemesLikeController {
  /** Current user-selected theme from next-themes useTheme(). */
  theme?: string;
  /** Browser/provider resolved theme from next-themes useTheme(). */
  resolvedTheme?: string;
  /** System theme from next-themes when enableSystem is configured. */
  systemTheme?: string;
  /** Provider-supported theme names from next-themes useTheme(). */
  themes?: readonly string[];
  /** Setter from next-themes useTheme(). */
  setTheme(theme: string): void;
}

export interface ThemeToggleOption {
  value: CalculatorTheme;
  label: string;
  shortLabel: string;
  icon: string;
  ariaLabel: string;
  title: string;
}

export interface ThemeToggleControlProps {
  role: 'radio';
  type: 'button';
  tabIndex: 0 | -1;
  ariaChecked: boolean;
  ariaLabel: string;
  dataTheme: CalculatorTheme;
}

export interface ThemeToggleModelOption extends ThemeToggleOption {
  isSelected: boolean;
  controlProps: ThemeToggleControlProps;
}

export interface ThemeToggleModel {
  mounted: boolean;
  selectedTheme: CalculatorTheme;
  resolvedTheme: ResolvedCalculatorTheme | null;
  supportsSystem: boolean;
  statusText: string;
  toggleAriaLabel: string;
  options: readonly ThemeToggleModelOption[];
  groupProps: {
    role: 'radiogroup';
    ariaLabel: string;
  };
  classes: typeof calculatorThemeToggleClasses;
}

export const CALCULATOR_THEME_OPTIONS: readonly ThemeToggleOption[] = Object.freeze([
  {
    value: 'light',
    label: 'Light',
    shortLabel: 'Light',
    icon: '☀',
    ariaLabel: 'Use light calculator theme',
    title: 'Light theme',
  },
  {
    value: 'dark',
    label: 'Dark',
    shortLabel: 'Dark',
    icon: '☾',
    ariaLabel: 'Use dark calculator theme',
    title: 'Dark theme',
  },
  {
    value: 'system',
    label: 'System',
    shortLabel: 'Auto',
    icon: '◐',
    ariaLabel: 'Use system calculator theme',
    title: 'System theme',
  },
]);

/**
 * Tailwind classes intended for a glassmorphism calculator toolbar. They are
 * exported as tokens so a React/Next component can consume them without
 * scattering dark-mode styling across the feature.
 */
export const calculatorThemeToggleClasses = Object.freeze({
  root: [
    'inline-flex max-w-full items-center gap-1 rounded-full border border-white/50',
    'bg-white/60 p-1 text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur-xl',
    'transition-colors duration-200 motion-reduce:transition-none',
    'dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-100 dark:shadow-black/25',
  ].join(' '),
  option: [
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold',
    'outline-none transition-[background-color,color,box-shadow] duration-200 motion-reduce:transition-none',
    'hover:bg-white/80 hover:text-slate-950',
    'focus-visible:ring-4 focus-visible:ring-indigo-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-indigo-300/90 dark:focus-visible:ring-offset-slate-950',
  ].join(' '),
  optionActive: [
    'bg-white text-slate-950 shadow-sm shadow-slate-900/10',
    'dark:bg-slate-100 dark:text-slate-950 dark:shadow-black/20',
  ].join(' '),
  optionInactive: 'text-slate-700 dark:text-slate-200',
  icon: 'text-base leading-none',
  label: 'sr-only sm:not-sr-only sm:ml-2',
  mountedPlaceholder: 'h-9 min-w-[5.5rem] rounded-full bg-white/45 motion-reduce:animate-none dark:bg-white/10',
});

export function createCalculatorThemeToggleModel(
  controller: NextThemesLikeController,
  mounted: boolean,
): ThemeToggleModel {
  const supportedThemes = getSupportedCalculatorThemes(controller);
  const selectedTheme = coerceCalculatorTheme(controller.theme, supportedThemes);
  const resolvedTheme = mounted ? resolveCalculatorTheme(controller) : null;
  const statusText = mounted
    ? buildMountedStatusText(selectedTheme, resolvedTheme)
    : 'Theme controls loading';

  const options = supportedThemes.map<ThemeToggleModelOption>((theme, index) => {
    const baseOption = getThemeOption(theme);
    const isSelected = selectedTheme === theme;

    return {
      ...baseOption,
      isSelected,
      controlProps: {
        role: 'radio',
        type: 'button',
        tabIndex: isSelected || (!supportedThemes.includes(selectedTheme) && index === 0) ? 0 : -1,
        ariaChecked: isSelected,
        ariaLabel: baseOption.ariaLabel,
        dataTheme: theme,
      },
    };
  });

  return {
    mounted,
    selectedTheme,
    resolvedTheme,
    supportsSystem: supportedThemes.includes('system'),
    statusText,
    toggleAriaLabel: mounted
      ? `Calculator theme: ${statusText}`
      : 'Calculator theme controls',
    options,
    groupProps: {
      role: 'radiogroup',
      ariaLabel: 'Calculator theme',
    },
    classes: calculatorThemeToggleClasses,
  };
}

export function getSupportedCalculatorThemes(
  controller: Pick<NextThemesLikeController, 'theme' | 'themes' | 'systemTheme'>,
): readonly CalculatorTheme[] {
  const providerThemes = new Set(controller.themes ?? []);
  const hasProviderThemeList = controller.themes !== undefined;
  const supportsSystem =
    providerThemes.has('system') ||
    controller.theme === 'system' ||
    isResolvedCalculatorTheme(controller.systemTheme);

  const themes: CalculatorTheme[] = ['light', 'dark'];

  if (!hasProviderThemeList || supportsSystem) {
    themes.push('system');
  }

  return themes;
}

export function setCalculatorTheme(
  controller: NextThemesLikeController,
  theme: CalculatorTheme,
): boolean {
  if (!getSupportedCalculatorThemes(controller).includes(theme)) {
    return false;
  }

  controller.setTheme(theme);
  return true;
}

export function toggleCalculatorTheme(controller: NextThemesLikeController): CalculatorTheme {
  const supportedThemes = getSupportedCalculatorThemes(controller);
  const currentTheme = coerceCalculatorTheme(controller.theme, supportedThemes);
  const currentIndex = supportedThemes.indexOf(currentTheme);
  const nextTheme = supportedThemes[(currentIndex + 1) % supportedThemes.length] ?? 'light';

  controller.setTheme(nextTheme);
  return nextTheme;
}

export function resolveCalculatorTheme(
  controller: Pick<NextThemesLikeController, 'theme' | 'resolvedTheme' | 'systemTheme'>,
): ResolvedCalculatorTheme {
  if (isResolvedCalculatorTheme(controller.resolvedTheme)) {
    return controller.resolvedTheme;
  }

  if (controller.theme === 'system' && isResolvedCalculatorTheme(controller.systemTheme)) {
    return controller.systemTheme;
  }

  if (isResolvedCalculatorTheme(controller.theme)) {
    return controller.theme;
  }

  return 'light';
}

function buildMountedStatusText(
  selectedTheme: CalculatorTheme,
  resolvedTheme: ResolvedCalculatorTheme | null,
): string {
  if (selectedTheme === 'system') {
    return `System (${resolvedTheme ?? 'unknown'})`;
  }

  return selectedTheme === 'dark' ? 'Dark' : 'Light';
}

function coerceCalculatorTheme(
  theme: string | undefined,
  supportedThemes: readonly CalculatorTheme[],
): CalculatorTheme {
  if (isCalculatorTheme(theme) && supportedThemes.includes(theme)) {
    return theme;
  }

  return supportedThemes[0] ?? 'light';
}

function getThemeOption(theme: CalculatorTheme): ThemeToggleOption {
  const option = CALCULATOR_THEME_OPTIONS.find((candidate) => candidate.value === theme);

  if (!option) {
    throw new Error(`Unsupported calculator theme: ${theme}`);
  }

  return option;
}

function isCalculatorTheme(theme: string | undefined): theme is CalculatorTheme {
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

function isResolvedCalculatorTheme(theme: string | undefined): theme is ResolvedCalculatorTheme {
  return theme === 'light' || theme === 'dark';
}
