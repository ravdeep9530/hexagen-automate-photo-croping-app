import { describe, expect, it } from 'vitest';
import type { CalculatorHistoryController, HistoryEntry } from '../../features/calculator/types';
import { createHistoryEntry } from '../../features/calculator/storage';
import { useCalculatorShell } from './calculator-shell';

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

describe('calculator keypad interactions', () => {
  it('clicking 8, multiply, 5, equals renders result 40 and records history', () => {
    const shell = useCalculatorShell({
      historyController: createMemoryHistoryController(),
      keyboard: { target: null },
      now: () => new Date('2024-03-04T05:06:07.000Z'),
      createId: () => 'history-8-times-5',
    });

    for (const buttonId of ['eight', 'multiply', 'five', 'equals']) {
      const action = shell.model.handlers.pressKeypadButton(buttonId);
      expect(action === null).toBe(false);
    }

    expect(shell.calculator.state.display).toBe('40');
    expect(shell.model.display.result).toBe('40');
    expect(shell.model.display.expression).toBe('8 × 5 =');
    expect(shell.model.historyPanel.entries.map((entry) => entry.id)).toEqual([
      'history-8-times-5',
    ]);
    expect(shell.calculator.history).toEqual([
      {
        id: 'history-8-times-5',
        expression: '8 × 5 =',
        result: '40',
        createdAt: '2024-03-04T05:06:07.000Z',
      },
    ]);
  });

  it('division by zero renders the controlled calculator error message', () => {
    const shell = useCalculatorShell({
      historyController: createMemoryHistoryController(),
      keyboard: { target: null },
    });

    for (const buttonId of ['eight', 'divide', 'zero', 'equals']) {
      shell.model.handlers.pressKeypadButton(buttonId);
    }

    expect(shell.calculator.state.status).toBe('error');
    expect(shell.calculator.state.display).toBe('Cannot divide by zero');
    expect(shell.model.display.result).toBe('Cannot divide by zero');
    expect(shell.model.display.props.ariaLive).toBe('assertive');
    expect(shell.calculator.history).toEqual([]);
  });
});

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
