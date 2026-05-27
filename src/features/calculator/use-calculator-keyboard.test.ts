import { describe, expect, it } from 'vitest';
import {
  createKeyboardActionMap,
  handleCalculatorKeyboardEvent,
  subscribeCalculatorKeyboard,
} from './use-calculator-keyboard';
import { calculatorReducer, initialCalculatorState } from './engine';
import type { CalculatorAction, CalculatorState } from './types';

class KeyboardTargetStub {
  readonly listeners = new Set<(event: KeyboardEvent) => void>();
  addCount = 0;
  removeCount = 0;

  addEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void {
    expect(type).toBe('keydown');
    this.addCount += 1;
    this.listeners.add(listener);
  }

  removeEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void {
    expect(type).toBe('keydown');
    this.removeCount += 1;
    this.listeners.delete(listener);
  }

  keydown(key: string, options: { repeat?: boolean; defaultPrevented?: boolean } = {}): void {
    for (const listener of Array.from(this.listeners)) {
      listener(createKeyboardEvent(key, options) as unknown as KeyboardEvent);
    }
  }
}

describe('calculator keyboard input', () => {
  it('maps digits, decimal, operators, equals, and clear keys through button config', () => {
    const actions = createKeyboardActionMap();

    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const) {
      expect(actions.get(digit)?.action).toEqual({ type: 'digit', digit });
    }

    expect(actions.get('.')?.action).toEqual({ type: 'decimal' });
    expect(actions.get('+')?.action).toEqual({ type: 'operator', operator: 'add' });
    expect(actions.get('-')?.action).toEqual({ type: 'operator', operator: 'subtract' });
    expect(actions.get('*')?.action).toEqual({ type: 'operator', operator: 'multiply' });
    expect(actions.get('x')?.action).toEqual({ type: 'operator', operator: 'multiply' });
    expect(actions.get('X')?.action).toEqual({ type: 'operator', operator: 'multiply' });
    expect(actions.get('/')?.action).toEqual({ type: 'operator', operator: 'divide' });
    expect(actions.get('Enter')?.action).toEqual({ type: 'equals' });
    expect(actions.get('=')?.action).toEqual({ type: 'equals' });
    expect(actions.get('Escape')?.action).toEqual({ type: 'clear' });
    expect(actions.get('Backspace')?.action).toEqual({ type: 'clear' });
    expect(actions.get('Delete')?.action).toEqual({ type: 'clear' });
  });

  it('dispatches supported keydown events and prevents default only for matches', () => {
    let state: CalculatorState = initialCalculatorState;
    const dispatched: CalculatorAction[] = [];
    const dispatch = (action: CalculatorAction) => {
      dispatched.push(action);
      state = calculatorReducer(state, action);
    };

    const unsupported = createKeyboardEvent('a');
    expect(handleCalculatorKeyboardEvent(unsupported, dispatch)).toBe(false);
    expect(unsupported.preventDefaultCalled).toBe(false);
    expect(state).toBe(initialCalculatorState);
    expect(dispatched).toEqual([]);

    for (const key of ['1', '2', '.', '5', '+', '3', 'Enter']) {
      const event = createKeyboardEvent(key);
      expect(handleCalculatorKeyboardEvent(event, dispatch)).toBe(true);
      expect(event.preventDefaultCalled).toBe(true);
    }

    expect(dispatched).toEqual([
      { type: 'digit', digit: '1' },
      { type: 'digit', digit: '2' },
      { type: 'decimal' },
      { type: 'digit', digit: '5' },
      { type: 'operator', operator: 'add' },
      { type: 'digit', digit: '3' },
      { type: 'equals' },
    ]);
    expect(state.display).toBe('15.5');
    expect(state.expression).toBe('12.5 + 3 =');
  });

  it('does not dispatch or prevent default for already prevented events', () => {
    const dispatched: CalculatorAction[] = [];
    const event = createKeyboardEvent('1', { defaultPrevented: true });

    expect(handleCalculatorKeyboardEvent(event, (action) => dispatched.push(action))).toBe(false);
    expect(event.preventDefaultCalled).toBe(false);
    expect(dispatched).toEqual([]);
  });

  it('registers one keydown listener and removes the same handler on dispose', () => {
    const target = new KeyboardTargetStub();
    const dispatched: CalculatorAction[] = [];

    const subscription = subscribeCalculatorKeyboard(
      (action) => dispatched.push(action),
      { target },
    );

    expect(target.addCount).toBe(1);
    expect(target.removeCount).toBe(0);
    expect(target.listeners.size).toBe(1);

    target.keydown('x');
    expect(dispatched).toEqual([{ type: 'operator', operator: 'multiply' }]);

    subscription.dispose();
    expect(target.removeCount).toBe(1);
    expect(target.listeners.size).toBe(0);

    target.keydown('1');
    expect(dispatched).toEqual([{ type: 'operator', operator: 'multiply' }]);
  });

  it('does not register global listeners while disabled or without a target', () => {
    const target = new KeyboardTargetStub();

    const disabled = subscribeCalculatorKeyboard(() => undefined, {
      target,
      enabled: false,
    });
    disabled.dispose();

    expect(target.addCount).toBe(0);
    expect(target.removeCount).toBe(0);

    const ssrSafe = subscribeCalculatorKeyboard(() => undefined, { target: null });
    ssrSafe.dispose();
  });
});

interface TestKeyboardEvent {
  key: string;
  repeat: boolean;
  defaultPrevented: boolean;
  preventDefaultCalled: boolean;
  preventDefault(): void;
}

function createKeyboardEvent(
  key: string,
  options: { repeat?: boolean; defaultPrevented?: boolean } = {},
): TestKeyboardEvent {
  const event = {
    key,
    repeat: options.repeat ?? false,
    defaultPrevented: options.defaultPrevented ?? false,
    preventDefaultCalled: false,
    preventDefault() {
      event.preventDefaultCalled = true;
      event.defaultPrevented = true;
    },
  };

  return event;
}
