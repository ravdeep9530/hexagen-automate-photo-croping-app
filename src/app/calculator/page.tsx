import {
  CalculatorShell,
  type CalculatorShellController,
} from '../../components/calculator/calculator-shell';
import {
  calculatorPageMetadata,
  calculatorPageShellOptions,
} from './page-config';

export const metadata = calculatorPageMetadata;

export interface CalculatorPageProps {
  readonly shell?: CalculatorShellController;
}

/**
 * Additive App Router page for GET /calculator.
 *
 * In a full Next.js runtime this default export is the server-rendered page
 * module. It composes the calculator client shell without touching unrelated
 * routes and passes SSR-safe options so the server render does not subscribe to
 * keyboard events or require browser storage.
 */
export default function CalculatorPage(props: CalculatorPageProps = {}): CalculatorShellController {
  return props.shell ?? CalculatorShell(calculatorPageShellOptions);
}
