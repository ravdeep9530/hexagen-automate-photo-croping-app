import type { UseCalculatorShellOptions } from '../../components/calculator/calculator-shell';

export const CALCULATOR_ROUTE_PATH = '/calculator';

/**
 * Minimal structural metadata shape compatible with Next.js App Router metadata
 * exports while keeping this lightweight package free of a hard `next` type
 * dependency.
 */
export interface CalculatorPageMetadata {
  readonly title: string;
  readonly description: string;
  readonly alternates: {
    readonly canonical: string;
  };
}

export const calculatorPageMetadata: CalculatorPageMetadata = Object.freeze({
  title: 'Calculator',
  description: 'A polished glassmorphism calculator with keyboard input and calculation history.',
  alternates: Object.freeze({
    canonical: CALCULATOR_ROUTE_PATH,
  }),
});

/**
 * Server-render defaults for the additive /calculator route.
 *
 * The App Router page must be importable during SSR, so these options avoid any
 * browser-only targets during the initial server render. Client-only behavior
 * such as localStorage-backed history remains encapsulated behind the client
 * shell/hooks and their own `typeof window` guards.
 */
export const calculatorPageShellOptions: UseCalculatorShellOptions = Object.freeze({
  keyboard: Object.freeze({
    target: null,
    enabled: false,
  }),
  keyboardEnabled: false,
  mounted: false,
});
