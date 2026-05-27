import { describe, expect, it } from 'vitest';
import type { CalculatorAction, HistoryEntry } from '../../features/calculator/types';
import {
  createHistoryPanelControllerHandlers,
  createHistoryPanelInteractionHandlers,
  createHistoryPanelViewModel,
  formatHistoryTimestamp,
} from './history-panel';

function historyEntry(
  id: string,
  expression: string,
  result: string,
  createdAt: string,
): HistoryEntry {
  return { id, expression, result, createdAt };
}

const older = historyEntry('older', '1 + 2 =', '3', '2024-02-03T04:05:06.000Z');
const newest = historyEntry('newest', '9 × 9 =', '81', '2024-02-04T04:05:06.000Z');

describe('history panel view model', () => {
  it('renders newest-first history rows with expression, result, and formatted timestamp', () => {
    const panel = createHistoryPanelViewModel([older, newest], {
      locale: 'en-US',
      timeZone: 'UTC',
      now: new Date('2024-06-01T00:00:00.000Z'),
    });

    expect(panel.isEmpty).toBe(false);
    expect(panel.entries.map((entry) => entry.id)).toEqual(['newest', 'older']);
    expect(panel.entries[0].expression).toBe('9 × 9 =');
    expect(panel.entries[0].result).toBe('81');
    expect(panel.entries[0].timestampText).toBe('Feb 4, 4:05 AM');
    expect(panel.entries[0].buttonProps.type).toBe('button');
    expect(panel.entries[0].buttonProps.ariaLabel).toBe('Restore calculation 9 × 9 = 81');
  });

  it('renders an accessible empty state and disables clear history when no entries exist', () => {
    const panel = createHistoryPanelViewModel([]);

    expect(panel.isEmpty).toBe(true);
    expect(panel.entries).toEqual([]);
    expect(panel.emptyState.title).toBe('No calculations yet');
    expect(panel.emptyState.description.includes('press equals')).toBe(true);
    expect(panel.clearButton.disabled).toBe(true);
    expect(panel.props.role).toBe('region');
    expect(panel.props.ariaLabel).toBe('Calculation history');
  });

  it('keeps expressions and results as plain text content without HTML rendering contracts', () => {
    const unsafe = historyEntry(
      'unsafe',
      '<img src=x onerror=alert(1)> + 1 =',
      '<strong>2</strong>',
      '2024-02-05T04:05:06.000Z',
    );
    const panel = createHistoryPanelViewModel([unsafe]);

    expect(panel.entries[0].expression).toBe('<img src=x onerror=alert(1)> + 1 =');
    expect(panel.entries[0].result).toBe('<strong>2</strong>');
    expect(Object.keys(panel.entries[0]).includes('dangerouslySetInnerHTML')).toBe(false);
  });

  it('exposes responsive mobile and desktop layout classes', () => {
    const panel = createHistoryPanelViewModel([newest]);

    expect(panel.className.includes('w-full')).toBe(true);
    expect(panel.className.includes('min-w-0')).toBe(true);
    expect(panel.className.includes('md:max-h')).toBe(true);
    expect(panel.className.includes('lg:w-80')).toBe(true);
    expect(panel.headerClassName.includes('sm:flex-row')).toBe(true);
    expect(panel.listClassName.includes('overflow-y-auto')).toBe(true);
  });

  it('uses short Framer Motion panel and row transitions', () => {
    const panel = createHistoryPanelViewModel([newest]);

    expect(panel.motion.transition.duration).toBe(0.16);
    expect(panel.entries[0].motion.transition.duration).toBe(0.12);
    expect(panel.clearButton.motion.transition.duration).toBe(0.12);
  });

  it('formats timestamps with year when entry is from a different year', () => {
    expect(formatHistoryTimestamp('2023-02-03T04:05:06.000Z', {
      locale: 'en-US',
      timeZone: 'UTC',
      now: new Date('2024-01-01T00:00:00.000Z'),
    })).toBe('Feb 3, 2023, 4:05 AM');
  });
});

describe('history panel interactions', () => {
  it('selecting a history entry dispatches a restore-history action', () => {
    const dispatched: CalculatorAction[] = [];
    const handlers = createHistoryPanelInteractionHandlers(
      [newest, older],
      (action) => dispatched.push(action),
      () => [],
    );

    expect(handlers.selectEntry('older')).toEqual({ type: 'restore-history', entry: older });
    expect(dispatched).toEqual([{ type: 'restore-history', entry: older }]);
    expect(handlers.selectEntry('missing')).toBe(null);
    expect(dispatched.length).toBe(1);
  });

  it('clear-history control removes in-memory and persisted entries through the controller', () => {
    const dispatched: CalculatorAction[] = [];
    let clearCalls = 0;
    let entries: readonly HistoryEntry[] = [newest];
    const controller = {
      get history() {
        return entries;
      },
      clearHistory() {
        clearCalls += 1;
        entries = [];
        return entries;
      },
    };
    const handlers = createHistoryPanelControllerHandlers(controller, (action) => dispatched.push(action));

    expect(handlers.clearHistory()).toEqual([]);
    expect(controller.history).toEqual([]);
    expect(clearCalls).toBe(1);
    expect(dispatched).toEqual([]);
  });
});
