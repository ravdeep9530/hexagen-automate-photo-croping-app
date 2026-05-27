import { describe, expect, it } from 'vitest';
import { calculatorButtons } from '../../features/calculator/button-config';
import type { CalculatorAction, CalculatorState } from '../../features/calculator/types';
import {
  createCalculatorButtonViewModel,
  getCalculatorButtonAction,
} from './calculator-button';
import {
  createCalculatorDisplayViewModel,
  calculatorDisplayResultStatusClasses,
  calculatorDisplayStatusClasses,
} from './calculator-display';
import {
  createCalculatorKeypadInteractionHandlers,
  createCalculatorKeypadViewModel,
  dispatchCalculatorButtonAction,
} from './calculator-keypad';

describe('calculator display model', () => {
  it('renders expression and result as text strings only', () => {
    const model = createCalculatorDisplayViewModel({
      expression: '2 + 3 =',
      display: '5',
      status: 'result',
    });

    expect(model.expression).toBe('2 + 3 =');
    expect(model.result).toBe('5');
    expect(model.props.role).toBe('status');
    expect(model.props.ariaLive).toBe('polite');
    expect(model.rootClassName.includes('overflow-hidden')).toBe(true);
  });

  it('visually distinguishes idle, editing, result, and error states', () => {
    const states: CalculatorState['status'][] = ['idle', 'editing', 'result', 'error'];
    const rootClasses = states.map((status) =>
      createCalculatorDisplayViewModel({ expression: '', display: '0', status }).rootClassName,
    );
    const resultClasses = states.map((status) =>
      createCalculatorDisplayViewModel({ expression: '', display: '0', status }).resultClassName,
    );

    expect(new Set(rootClasses).size).toBe(states.length);
    expect(new Set(resultClasses).size).toBe(states.length);
    expect(calculatorDisplayStatusClasses.error.includes('rose')).toBe(true);
    expect(calculatorDisplayResultStatusClasses.result.includes('emerald')).toBe(true);
    expect(createCalculatorDisplayViewModel({ expression: '', display: 'Cannot divide by zero', status: 'error' }).props.ariaLive).toBe('assertive');
  });
});

describe('calculator button and keypad models', () => {
  it('renders every button from shared CalculatorButtonConfig with aria labels', () => {
    const keypad = createCalculatorKeypadViewModel();

    expect(keypad.buttons.map((button) => button.id)).toEqual(
      calculatorButtons.map((button) => button.id),
    );
    expect(keypad.props.role).toBe('group');
    expect(keypad.props.ariaLabel).toBe('Calculator keypad');

    for (const button of keypad.buttons) {
      expect(button.buttonProps.type).toBe('button');
      expect(button.ariaLabel.length > 0).toBe(true);
      expect(button.buttonProps.ariaLabel).toBe(button.ariaLabel);
      expect(button.className.includes('focus-visible:ring')).toBe(true);
    }
  });

  it('uses distinct visual variants for operator, clear, equals, decimal, and digit buttons', () => {
    const variantClasses = new Map(
      createCalculatorKeypadViewModel().buttons.map((button) => [button.variant, button.className]),
    );

    expect(variantClasses.get('digit')?.includes('bg-white')).toBe(true);
    expect(variantClasses.get('decimal')?.includes('sky')).toBe(true);
    expect(variantClasses.get('operator')?.includes('amber')).toBe(true);
    expect(variantClasses.get('clear')?.includes('rose')).toBe(true);
    expect(variantClasses.get('equals')?.includes('indigo')).toBe(true);
    expect(new Set(variantClasses.values()).size).toBe(5);
  });

  it('normalizes button configs into calculator actions', () => {
    const actionsById = new Map(
      calculatorButtons.map((button) => [button.id, getCalculatorButtonAction(button)]),
    );

    expect(actionsById.get('one')).toEqual({ type: 'digit', digit: '1' });
    expect(actionsById.get('decimal')).toEqual({ type: 'decimal' });
    expect(actionsById.get('add')).toEqual({ type: 'operator', operator: 'add' });
    expect(actionsById.get('equals')).toEqual({ type: 'equals' });
    expect(actionsById.get('clear')).toEqual({ type: 'clear' });
  });

  it('dispatches normalized calculator actions on pointer interactions', () => {
    const dispatched: CalculatorAction[] = [];
    const one = calculatorButtons.find((button) => button.id === 'one');
    const add = calculatorButtons.find((button) => button.id === 'add');

    if (!one || !add) {
      throw new Error('Expected one and add buttons to exist');
    }

    expect(dispatchCalculatorButtonAction(one, (action) => dispatched.push(action))).toEqual({
      type: 'digit',
      digit: '1',
    });
    expect(dispatchCalculatorButtonAction(add, (action) => dispatched.push(action))).toEqual({
      type: 'operator',
      operator: 'add',
    });
    expect(dispatched).toEqual([
      { type: 'digit', digit: '1' },
      { type: 'operator', operator: 'add' },
    ]);

    const handlers = createCalculatorKeypadInteractionHandlers((action) => dispatched.push(action));
    handlers.get('equals')?.();
    expect(dispatched[2]).toEqual({ type: 'equals' });
  });

  it('exposes Framer Motion press feedback without async dispatch requirements', () => {
    const model = createCalculatorButtonViewModel(calculatorButtons[0]);

    expect(model.motion.whileTap.scale).toBe(0.96);
    expect(model.motion.whileTap.y).toBe(1);
    expect(model.motion.transition.type).toBe('spring');
  });

  it('uses responsive, non-horizontal-scrolling keypad classes', () => {
    const keypad = createCalculatorKeypadViewModel();

    expect(keypad.className.includes('w-full')).toBe(true);
    expect(keypad.className.includes('min-w-0')).toBe(true);
    expect(keypad.className.includes('overflow-hidden')).toBe(true);
    expect(keypad.className.includes('grid-cols-4')).toBe(true);
    expect(keypad.buttons.find((button) => button.id === 'zero')?.gridClassName).toBe('col-span-2');
  });
});
