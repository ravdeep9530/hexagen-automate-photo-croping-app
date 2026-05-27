import { describe, expect, it } from 'vitest';
import { CALCULATOR_HISTORY_STORAGE_KEY } from './storage';
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

function createStorage(seed: Record<string, string> = {}): Storage & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed));
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
  };

  return storage;
}

function historyEntry(id: string, createdAt: string): HistoryEntry {
  return {
    id,
    expression: `${id} + 1 =`,
    result: '2',
    createdAt,
  };
}

describe('useCalculatorHistory localStorage resilience', () => {
  it('ignores corrupted localStorage history safely when creating the controller', () => {
    const storage = createStorage({
      [CALCULATOR_HISTORY_STORAGE_KEY]: '{this-is-not-json',
    });
    setWindow({ localStorage: storage });

    const controller = createCalculatorHistoryController();

    expect(controller.history).toEqual([]);

    const nextHistory = controller.addEntry({
      id: 'safe-entry',
      expression: '8 × 5 =',
      result: '40',
      createdAt: '2024-03-04T05:06:07.000Z',
    });

    expect(nextHistory).toEqual([
      {
        id: 'safe-entry',
        expression: '8 × 5 =',
        result: '40',
        createdAt: '2024-03-04T05:06:07.000Z',
      },
    ]);
    expect(JSON.parse(storage.getItem(CALCULATOR_HISTORY_STORAGE_KEY) ?? '[]')).toEqual(nextHistory);

    restoreWindow();
  });

  it('filters invalid stored entry shapes while keeping valid history entries', () => {
    const valid = historyEntry('valid', '2024-03-04T05:06:07.000Z');
    const newer = historyEntry('newer', '2024-03-05T05:06:07.000Z');
    const storage = createStorage({
      [CALCULATOR_HISTORY_STORAGE_KEY]: JSON.stringify([
        null,
        { id: 'missing-result', expression: '1 + 1 =', createdAt: '2024-03-01T00:00:00.000Z' },
        valid,
        { id: 'bad-date', expression: '1 + 1 =', result: '2', createdAt: 'today' },
        newer,
      ]),
    });
    setWindow({ localStorage: storage });

    const controller = createCalculatorHistoryController();

    expect(controller.history).toEqual([newer, valid]);

    restoreWindow();
  });
});
