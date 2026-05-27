import {
  calculatorReducer,
  initialCalculatorState,
} from './engine';
import { createHistoryEntry, isHistoryEntry } from './storage';
import { useCalculatorHistory } from './use-calculator-history';
import type {
  CalculatorAction,
  CalculatorDispatch,
  CalculatorHistoryController,
  CalculatorState,
  HistoryEntry,
} from './types';

export interface CalculatorController {
  readonly state: CalculatorState;
  readonly history: readonly HistoryEntry[];
  dispatch: CalculatorDispatch;
  clearHistory(): readonly HistoryEntry[];
}

export interface UseCalculatorOptions {
  historyController?: CalculatorHistoryController;
  initialState?: CalculatorState;
  now?: () => Date;
  createId?: (createdAt: string) => string;
}

/**
 * State wrapper around the pure calculator reducer.
 *
 * The reducer stays deterministic and side-effect free. This hook-like
 * controller performs history persistence after successful equals actions and
 * delegates all browser storage access to the history hook abstraction.
 */
export function useCalculator(options: UseCalculatorOptions = {}): CalculatorController {
  const historyController = options.historyController ?? useCalculatorHistory();
  let state = options.initialState ?? initialCalculatorState;

  const controller: CalculatorController = {
    get state() {
      return state;
    },
    get history() {
      return historyController.history;
    },
    dispatch(action: CalculatorAction) {
      const previousState = state;
      const nextState = calculatorReducer(previousState, action);

      if (action.type === 'restore-history' && !isHistoryEntry(action.entry)) {
        state = previousState;
        return;
      }

      state = nextState;

      if (shouldPersistHistoryEntry(action, previousState, nextState)) {
        const createdAt = (options.now?.() ?? new Date()).toISOString();
        const entry = createHistoryEntry({
          id: options.createId?.(createdAt),
          expression: nextState.expression,
          result: nextState.display,
          createdAt,
        });

        historyController.addEntry(entry);
      }
    },
    clearHistory() {
      return historyController.clearHistory();
    },
  };

  return controller;
}

function shouldPersistHistoryEntry(
  action: CalculatorAction,
  previousState: CalculatorState,
  nextState: CalculatorState,
): boolean {
  return (
    action.type === 'equals' &&
    nextState !== previousState &&
    nextState.status === 'result' &&
    nextState.expression.length > 0 &&
    nextState.display.length > 0
  );
}
