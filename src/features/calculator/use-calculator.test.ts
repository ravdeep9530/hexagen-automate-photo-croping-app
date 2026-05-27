import { describe, expect, it } from 'vitest';
import { createHistoryEntry } from './storage';
import { useCalculator } from './use-calculator';
import type {
  CalculatorAction,
  CalculatorDispatch,
  CalculatorHistoryController,
  HistoryEntry,
} from './types';

function createMemoryHistoryController(
  seed: readonly HistoryEntry[] = [],
): CalculatorHistoryController {
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

describe('useCalculator', () => {
  it('exposes current calculator state and a calculator dispatch-compatible function', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
    });
    const dispatch: CalculatorDispatch = calculator.dispatch;

    dispatch({ type: 'digit', digit: '4' });
    dispatch({ type: 'operator', operator: 'add' });
    dispatch({ type: 'digit', digit: '2' });

    expect(calculator.state.display).toBe('2');
    expect(calculator.state.expression).toBe('4 +');
    expect(calculator.history).toEqual([]);
  });

  it('creates a history entry with expression, result, id, and ISO createdAt after successful equals', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
      now: () => new Date('2024-02-03T04:05:06.789Z'),
      createId: (createdAt) => `history-for-${createdAt}`,
    });

    dispatchAll(calculator.dispatch, [
      { type: 'digit', digit: '4' },
      { type: 'operator', operator: 'multiply' },
      { type: 'digit', digit: '6' },
      { type: 'equals' },
    ]);

    expect(calculator.state.display).toBe('24');
    expect(calculator.history).toEqual([
      {
        id: 'history-for-2024-02-03T04:05:06.789Z',
        expression: '4 × 6 =',
        result: '24',
        createdAt: '2024-02-03T04:05:06.789Z',
      },
    ]);
  });

  it('does not persist history for error evaluations', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
      now: () => new Date('2024-02-03T04:05:06.789Z'),
    });

    dispatchAll(calculator.dispatch, [
      { type: 'digit', digit: '8' },
      { type: 'operator', operator: 'divide' },
      { type: 'digit', digit: '0' },
      { type: 'equals' },
    ]);

    expect(calculator.state.status).toBe('error');
    expect(calculator.state.display).toBe('Cannot divide by zero');
    expect(calculator.history).toEqual([]);
  });

  it('does not persist history for equals actions that do not evaluate', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
    });

    calculator.dispatch({ type: 'equals' });

    expect(calculator.state.status).toBe('idle');
    expect(calculator.history).toEqual([]);
  });

  it('validates restore-history entries before updating state', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
    });

    calculator.dispatch({ type: 'digit', digit: '9' });
    calculator.dispatch({
      type: 'restore-history',
      entry: {
        id: 'invalid-created-at',
        expression: '1 + 2 =',
        result: '3',
        createdAt: 1_700_000_000_000,
      },
    });

    expect(calculator.state.display).toBe('9');
    expect(calculator.state.status).toBe('editing');

    calculator.dispatch({
      type: 'restore-history',
      entry: {
        id: 'history-1',
        expression: '1 + 2 =',
        result: '3',
        createdAt: '2024-02-03T04:05:06.789Z',
      },
    });

    expect(calculator.state).toEqual({
      display: '3',
      storedValue: null,
      operator: null,
      expression: '1 + 2 =',
      status: 'result',
      shouldOverwriteDisplay: true,
    });
  });

  it('delegates history clearing to the history abstraction', () => {
    const calculator = useCalculator({
      historyController: createMemoryHistoryController(),
      now: () => new Date('2024-02-03T04:05:06.789Z'),
      createId: () => 'history-1',
    });

    dispatchAll(calculator.dispatch, [
      { type: 'digit', digit: '1' },
      { type: 'operator', operator: 'add' },
      { type: 'digit', digit: '2' },
      { type: 'equals' },
    ]);
    expect(calculator.history.length).toBe(1);

    expect(calculator.clearHistory()).toEqual([]);
    expect(calculator.history).toEqual([]);
  });
});

function dispatchAll(
  dispatch: CalculatorDispatch,
  actions: readonly CalculatorAction[],
): void {
  for (const action of actions) {
    dispatch(action);
  }
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
