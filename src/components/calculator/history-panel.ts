import type {
  CalculatorAction,
  CalculatorDispatch,
  CalculatorHistoryController,
  HistoryEntry,
} from '../../features/calculator/types';
import { normalizeCalculatorHistory } from '../../features/calculator/storage';
import { cn } from '../../lib/utils';

export interface HistoryPanelMotionTransition {
  readonly duration: number;
  readonly ease: readonly [number, number, number, number];
}

export interface HistoryPanelMotionState {
  readonly opacity: number;
  readonly y?: number;
  readonly scale?: number;
}

export interface HistoryPanelMotionConfig {
  readonly initial: HistoryPanelMotionState;
  readonly animate: HistoryPanelMotionState;
  readonly exit: HistoryPanelMotionState;
  readonly transition: HistoryPanelMotionTransition;
}

export interface HistoryPanelEntryRowModel {
  readonly id: string;
  /** Plain text expression. Render as textContent, never as raw HTML. */
  readonly expression: string;
  /** Plain text result. Render as textContent, never as raw HTML. */
  readonly result: string;
  readonly createdAt: string;
  readonly timestampText: string;
  readonly className: string;
  readonly expressionClassName: string;
  readonly resultClassName: string;
  readonly timestampClassName: string;
  readonly buttonProps: {
    readonly type: 'button';
    readonly ariaLabel: string;
    readonly dataHistoryEntry: string;
  };
  readonly motion: HistoryPanelMotionConfig;
}

export interface HistoryPanelClearButtonModel {
  readonly label: string;
  readonly className: string;
  readonly disabled: boolean;
  readonly buttonProps: {
    readonly type: 'button';
    readonly ariaLabel: string;
    readonly dataHistoryClear: true;
  };
  readonly motion: HistoryPanelMotionConfig;
}

export interface HistoryPanelEmptyStateModel {
  readonly title: string;
  readonly description: string;
  readonly className: string;
}

export interface HistoryPanelViewModel {
  readonly entries: readonly HistoryPanelEntryRowModel[];
  readonly isEmpty: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly className: string;
  readonly headerClassName: string;
  readonly listClassName: string;
  readonly emptyState: HistoryPanelEmptyStateModel;
  readonly clearButton: HistoryPanelClearButtonModel;
  readonly props: {
    readonly role: 'region';
    readonly ariaLabel: 'Calculation history';
    readonly dataHistoryPanel: true;
  };
  readonly motion: HistoryPanelMotionConfig;
}

export interface CreateHistoryPanelViewModelOptions {
  className?: string;
  locale?: string;
  timeZone?: string;
  title?: string;
  subtitle?: string;
  now?: Date;
}

export interface HistoryPanelInteractionHandlers {
  readonly selectEntry: (entryId: string) => CalculatorAction | null;
  readonly clearHistory: () => readonly HistoryEntry[];
}

const panelClasses = [
  'flex max-h-[min(32rem,70vh)] w-full min-w-0 flex-col overflow-hidden rounded-3xl',
  'border border-white/30 bg-white/55 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl',
  'transition-colors duration-200 md:max-h-[36rem] lg:w-80 xl:w-96',
  'dark:border-white/10 dark:bg-slate-950/45 dark:shadow-black/30',
].join(' ');

const headerClasses = [
  'flex flex-col gap-3 border-b border-white/25 p-4 sm:flex-row sm:items-center sm:justify-between',
  'dark:border-white/10',
].join(' ');

const listClasses = [
  'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 sm:p-4',
  'scrollbar-thin scrollbar-thumb-slate-300/80 scrollbar-track-transparent',
  'dark:scrollbar-thumb-slate-700/80',
].join(' ');

const rowClasses = [
  'group w-full min-w-0 rounded-2xl border border-white/30 bg-white/50 p-3 text-left',
  'shadow-sm shadow-slate-900/5 outline-none backdrop-blur-xl transition-colors duration-150',
  'hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-indigo-400',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
  'dark:border-white/10 dark:bg-slate-900/55 dark:shadow-black/15 dark:hover:bg-slate-800/75',
].join(' ');

const expressionClasses = [
  'block truncate text-sm font-medium tabular-nums text-slate-600',
  'dark:text-slate-300',
].join(' ');

const resultClasses = [
  'mt-1 block truncate text-xl font-bold tabular-nums text-slate-950',
  'dark:text-white',
].join(' ');

const timestampClasses = [
  'mt-2 block text-xs font-medium text-slate-500',
  'dark:text-slate-400',
].join(' ');

const clearButtonClasses = [
  'inline-flex h-9 items-center justify-center rounded-full border border-rose-200/70',
  'bg-rose-50/80 px-3 text-sm font-semibold text-rose-700 shadow-sm',
  'transition-colors duration-150 hover:bg-rose-100 focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2',
  'focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-45',
  'dark:border-rose-300/15 dark:bg-rose-500/15 dark:text-rose-100 dark:hover:bg-rose-500/25',
].join(' ');

const emptyStateClasses = [
  'flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed',
  'border-white/35 bg-white/35 p-6 text-center text-slate-600',
  'dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300',
].join(' ');

const standardEase: readonly [number, number, number, number] = [0.16, 1, 0.3, 1];

export const historyPanelMotion: HistoryPanelMotionConfig = Object.freeze({
  initial: Object.freeze({ opacity: 0, y: 8, scale: 0.98 }),
  animate: Object.freeze({ opacity: 1, y: 0, scale: 1 }),
  exit: Object.freeze({ opacity: 0, y: 6, scale: 0.99 }),
  transition: Object.freeze({ duration: 0.16, ease: standardEase }),
});

export const historyPanelRowMotion: HistoryPanelMotionConfig = Object.freeze({
  initial: Object.freeze({ opacity: 0, y: 4 }),
  animate: Object.freeze({ opacity: 1, y: 0 }),
  exit: Object.freeze({ opacity: 0, y: -4 }),
  transition: Object.freeze({ duration: 0.12, ease: standardEase }),
});

/**
 * Creates the render contract for a responsive calculation history panel.
 *
 * Calculator values are returned as plain strings only. A React/Next client
 * component should render expression, result, and timestamp directly as text
 * nodes and wire the provided interaction helpers to motion.button elements.
 */
export function createHistoryPanelViewModel(
  history: readonly HistoryEntry[],
  options: CreateHistoryPanelViewModelOptions = {},
): HistoryPanelViewModel {
  const entries = normalizeCalculatorHistory(history);
  const title = options.title ?? 'History';
  const subtitle = options.subtitle ?? 'Recent calculations';

  return {
    entries: entries.map((entry) => createHistoryPanelEntryRowModel(entry, options)),
    isEmpty: entries.length === 0,
    title,
    subtitle,
    className: cn(panelClasses, options.className),
    headerClassName: headerClasses,
    listClassName: listClasses,
    emptyState: {
      title: 'No calculations yet',
      description: 'Completed calculations will appear here after you press equals.',
      className: emptyStateClasses,
    },
    clearButton: {
      label: 'Clear',
      className: clearButtonClasses,
      disabled: entries.length === 0,
      buttonProps: {
        type: 'button',
        ariaLabel: 'Clear calculation history',
        dataHistoryClear: true,
      },
      motion: historyPanelRowMotion,
    },
    props: {
      role: 'region',
      ariaLabel: 'Calculation history',
      dataHistoryPanel: true,
    },
    motion: historyPanelMotion,
  };
}

export function createHistoryPanelEntryRowModel(
  entry: HistoryEntry,
  options: Pick<CreateHistoryPanelViewModelOptions, 'locale' | 'timeZone' | 'now'> = {},
): HistoryPanelEntryRowModel {
  return {
    id: entry.id,
    expression: entry.expression,
    result: entry.result,
    createdAt: entry.createdAt,
    timestampText: formatHistoryTimestamp(entry.createdAt, options),
    className: rowClasses,
    expressionClassName: expressionClasses,
    resultClassName: resultClasses,
    timestampClassName: timestampClasses,
    buttonProps: {
      type: 'button',
      ariaLabel: `Restore calculation ${entry.expression} ${entry.result}`,
      dataHistoryEntry: entry.id,
    },
    motion: historyPanelRowMotion,
  };
}

export function createHistoryPanelInteractionHandlers(
  history: readonly HistoryEntry[],
  dispatch: CalculatorDispatch,
  clearHistory: () => readonly HistoryEntry[],
): HistoryPanelInteractionHandlers {
  const entriesById = new Map(normalizeCalculatorHistory(history).map((entry) => [entry.id, entry]));

  return {
    selectEntry(entryId: string) {
      const entry = entriesById.get(entryId);

      if (!entry) {
        return null;
      }

      const action: CalculatorAction = { type: 'restore-history', entry };
      dispatch(action);
      return action;
    },
    clearHistory() {
      return clearHistory();
    },
  };
}

export function createHistoryPanelControllerHandlers(
  historyController: Pick<CalculatorHistoryController, 'history' | 'clearHistory'>,
  dispatch: CalculatorDispatch,
): HistoryPanelInteractionHandlers {
  return createHistoryPanelInteractionHandlers(
    historyController.history,
    dispatch,
    () => historyController.clearHistory(),
  );
}

export function formatHistoryTimestamp(
  createdAt: string,
  options: Pick<CreateHistoryPanelViewModelOptions, 'locale' | 'timeZone' | 'now'> = {},
): string {
  const timestamp = Date.parse(createdAt);

  if (!Number.isFinite(timestamp)) {
    return createdAt;
  }

  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat(options.locale ?? 'en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === (options.now ?? new Date()).getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: options.timeZone,
  });

  return formatter.format(date);
}
