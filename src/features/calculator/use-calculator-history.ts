import type {
  CalculatorHistoryController,
  CalculatorHistoryEntryInput,
  HistoryEntry,
} from './types';
import {
  createHistoryEntry,
  normalizeCalculatorHistory,
  readCalculatorHistory,
  writeCalculatorHistory,
  clearCalculatorHistoryStorage,
} from './storage';

/**
 * Creates a browser-safe calculator history controller backed by localStorage.
 *
 * The implementation intentionally avoids module-level reads from window so it
 * can be imported during SSR. When window/localStorage is unavailable, history
 * starts empty and mutations only update the controller's in-memory snapshot.
 */
export function createCalculatorHistoryController(
  initialHistory: readonly unknown[] = readCalculatorHistory(),
): CalculatorHistoryController {
  let history = normalizeCalculatorHistory(initialHistory);

  const controller: CalculatorHistoryController = {
    get history() {
      return history;
    },
    addEntry(entry: CalculatorHistoryEntryInput | HistoryEntry) {
      const nextEntry = createHistoryEntry(entry);
      history = writeCalculatorHistory([nextEntry, ...history]);
      return history;
    },
    clearHistory() {
      history = [];
      clearCalculatorHistoryStorage();
      return history;
    },
    setHistory(entries: readonly unknown[]) {
      history = writeCalculatorHistory(entries);
      return history;
    },
  };

  return controller;
}

export const useCalculatorHistory = createCalculatorHistoryController;
