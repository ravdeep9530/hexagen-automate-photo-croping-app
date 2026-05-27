import type { HistoryEntry } from './types';

export const CALCULATOR_HISTORY_STORAGE_KEY = 'calc.history.v1';
export const CALCULATOR_HISTORY_LIMIT = 20;

export function readCalculatorHistory(): HistoryEntry[] {
  const storage = getLocalStorage();

  if (!storage) {
    return [];
  }

  try {
    return parseCalculatorHistory(storage.getItem(CALCULATOR_HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeCalculatorHistory(entries: readonly unknown[]): HistoryEntry[] {
  const normalizedHistory = normalizeCalculatorHistory(entries);
  const storage = getLocalStorage();

  if (!storage) {
    return normalizedHistory;
  }

  try {
    storage.setItem(
      CALCULATOR_HISTORY_STORAGE_KEY,
      JSON.stringify(normalizedHistory),
    );
  } catch {
    // Storage may throw SecurityError or QuotaExceededError. Persistence is a
    // progressive enhancement, so callers still receive usable in-memory state.
  }

  return normalizedHistory;
}

export function clearCalculatorHistoryStorage(): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(CALCULATOR_HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage access failures so calculator usage is never blocked.
  }
}

export function parseCalculatorHistory(serializedHistory: string | null): HistoryEntry[] {
  if (serializedHistory === null) {
    return [];
  }

  try {
    return normalizeCalculatorHistory(JSON.parse(serializedHistory));
  } catch {
    return [];
  }
}

export function normalizeCalculatorHistory(entries: unknown): HistoryEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter(isHistoryEntry)
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, CALCULATOR_HISTORY_LIMIT);
}

export function createHistoryEntry(
  entry: Pick<HistoryEntry, 'expression' | 'result'> & Partial<Pick<HistoryEntry, 'id' | 'createdAt'>>,
): HistoryEntry {
  const createdAt = isValidCreatedAt(entry.createdAt) ? entry.createdAt : Date.now();
  const id = typeof entry.id === 'string' && entry.id.length > 0
    ? entry.id
    : createCalculatorHistoryId(createdAt);

  return {
    id,
    expression: entry.expression,
    result: entry.result,
    createdAt,
  };
}

export function isHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }

  const candidate = entry as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.expression === 'string' &&
    candidate.expression.length > 0 &&
    typeof candidate.result === 'string' &&
    candidate.result.length > 0 &&
    isValidCreatedAt(candidate.createdAt)
  );
}

function createCalculatorHistoryId(createdAt: number): string {
  const randomId = Math.random().toString(36).slice(2, 10);
  return `history-${createdAt}-${randomId}`;
}

function isValidCreatedAt(createdAt: unknown): createdAt is number {
  return typeof createdAt === 'number' && Number.isFinite(createdAt);
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
