import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_HISTORY_LIMIT,
  CALCULATOR_HISTORY_STORAGE_KEY,
  clearCalculatorHistoryStorage,
  createHistoryEntry,
  normalizeCalculatorHistory,
  parseCalculatorHistory,
  readCalculatorHistory,
  writeCalculatorHistory,
} from './storage';
import { createCalculatorHistoryController } from './use-calculator-history';
import type { HistoryEntry } from './types';

const originalWindow = globalThis.window;

function setWindow(value: unknown): void {
  Object.defineProperty(globalThis, 'window', {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreWindow(): void {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
    return;
  }

  setWindow(originalWindow);
}

function entry(id: string, createdAt: number): HistoryEntry {
  return {
    id,
    expression: `${id} + 1 =`,
    result: String(createdAt),
    createdAt,
  };
}

function createStorage(overrides: Partial<Storage> = {}): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  const storage: Storage & { data: Map<string, string> } = {
    data,
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    ...overrides,
  };

  return storage;
}

describe('calculator history storage', () => {
  it('returns an empty array when window is unavailable for SSR', () => {
    delete (globalThis as { window?: unknown }).window;

    expect(readCalculatorHistory()).toEqual([]);
    expect(writeCalculatorHistory([entry('one', 1)])).toEqual([entry('one', 1)]);
    clearCalculatorHistoryStorage();

    restoreWindow();
  });

  it('discards invalid JSON and invalid history entry shapes safely', () => {
    const malformedEntries: unknown[] = [
      null,
      '10 + 5 = 15',
      { expression: '10 + 5 =', result: '15', createdAt: 1_700_000_000_000 },
      { id: '', expression: '10 + 5 =', result: '15', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '', result: '15', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '10 + 5 =', result: '', createdAt: 1_700_000_000_000 },
      { id: 'history-1', expression: '10 + 5 =', result: '15', createdAt: Number.NaN },
      { id: 'history-1', expression: '10 + 5 =', result: '15', createdAt: 'today' },
    ];

    expect(parseCalculatorHistory('{not-json')).toEqual([]);
    expect(normalizeCalculatorHistory(malformedEntries)).toEqual([]);
  });

  it('accepts entries with string fields and finite createdAt values only', () => {
    const valid = entry('valid', 1_700_000_000_000);
    const withExtraFields = {
      ...entry('extra', 1_700_000_000_001),
      metadata: { ignored: true },
    };

    expect(normalizeCalculatorHistory([withExtraFields, valid])).toEqual([
      withExtraFields,
      valid,
    ]);
  });

  it('caps history to the latest 20 entries in newest-first order', () => {
    const entries = Array.from({ length: 25 }, (_, index) => entry(`id-${index}`, index));
    const normalized = normalizeCalculatorHistory(entries);

    expect(normalized.length).toBe(CALCULATOR_HISTORY_LIMIT);
    expect(normalized.map((historyEntry) => historyEntry.createdAt)).toEqual(
      Array.from({ length: 20 }, (_, index) => 24 - index),
    );
  });

  it('reads and writes using calc.history.v1 localStorage key', () => {
    const storage = createStorage();
    setWindow({ localStorage: storage });

    const oldest = entry('oldest', 100);
    const newest = entry('newest', 300);
    const middle = entry('middle', 200);

    expect(writeCalculatorHistory([oldest, newest, middle])).toEqual([
      newest,
      middle,
      oldest,
    ]);
    expect(JSON.parse(storage.getItem(CALCULATOR_HISTORY_STORAGE_KEY) ?? '[]')).toEqual([
      newest,
      middle,
      oldest,
    ]);
    expect(readCalculatorHistory()).toEqual([newest, middle, oldest]);

    clearCalculatorHistoryStorage();
    expect(storage.getItem(CALCULATOR_HISTORY_STORAGE_KEY)).toBe(null);

    restoreWindow();
  });

  it('catches localStorage SecurityError and QuotaExceededError without throwing', () => {
    const securityErrorWindow = Object.defineProperty({}, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
      configurable: true,
    });
    setWindow(securityErrorWindow);

    expect(readCalculatorHistory()).toEqual([]);
    expectNoThrow(() => clearCalculatorHistoryStorage());

    const quotaStorage = createStorage({
      setItem() {
        throw new DOMException('Full', 'QuotaExceededError');
      },
      removeItem() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
    setWindow({ localStorage: quotaStorage });

    expect(writeCalculatorHistory([entry('safe', 1)])).toEqual([entry('safe', 1)]);
    expectNoThrow(() => clearCalculatorHistoryStorage());

    restoreWindow();
  });

  it('exposes addEntry, clearHistory, and setHistory controller behavior', () => {
    const storage = createStorage();
    setWindow({ localStorage: storage });

    const controller = createCalculatorHistoryController();
    const first = controller.addEntry({
      id: 'first',
      expression: '1 + 1 =',
      result: '2',
      createdAt: 100,
    });

    expect(first).toEqual([entryWithExpression('first', '1 + 1 =', '2', 100)]);
    expect(controller.history).toEqual(first);

    const set = controller.setHistory([
      entry('older', 1),
      { id: 'invalid', expression: '', result: '0', createdAt: 2 },
      entry('newer', 2),
    ]);
    expect(set.map((historyEntry) => historyEntry.id)).toEqual(['newer', 'older']);

    expect(controller.clearHistory()).toEqual([]);
    expect(controller.history).toEqual([]);
    expect(storage.getItem(CALCULATOR_HISTORY_STORAGE_KEY)).toBe(null);

    restoreWindow();
  });

  it('creates missing ids and timestamps for new calculator history entries', () => {
    const created = createHistoryEntry({ expression: '2 × 3 =', result: '6' });

    expect(created.id.startsWith('history-')).toBe(true);
    expect(created.expression).toBe('2 × 3 =');
    expect(created.result).toBe('6');
    expect(Number.isFinite(created.createdAt)).toBe(true);
  });
});

function entryWithExpression(
  id: string,
  expression: string,
  result: string,
  createdAt: number,
): HistoryEntry {
  return { id, expression, result, createdAt };
}

function expectNoThrow(callback: () => void): void {
  let thrown = false;

  try {
    callback();
  } catch {
    thrown = true;
  }

  expect(thrown).toBe(false);
}
