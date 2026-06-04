import { describe, expect, it } from 'vitest';

import { announceError, mapApiErrorToMessage } from '../error-utils';

describe('mapApiErrorToMessage', () => {
  it('returns string errors directly', () => {
    expect(mapApiErrorToMessage('Upload failed')).toBe('Upload failed');
  });

  it('returns Error instance messages', () => {
    expect(mapApiErrorToMessage(new Error('Unexpected failure'))).toBe('Unexpected failure');
  });

  it('extracts a nested message property', () => {
    expect(mapApiErrorToMessage({ message: 'Bad request' })).toBe('Bad request');
  });

  it('extracts an error string property', () => {
    expect(mapApiErrorToMessage({ error: 'Invalid image format' })).toBe('Invalid image format');
  });

  it('extracts a message from an errors collection', () => {
    expect(
      mapApiErrorToMessage({
        errors: [{ message: 'Width is required' }, { message: 'Height is required' }],
      }),
    ).toBe('Width is required');
  });

  it('maps HTTP-like status responses to friendly messages', () => {
    expect(mapApiErrorToMessage({ status: 404 })).toBe('The requested resource could not be found.');
    expect(mapApiErrorToMessage({ response: { status: 500 } })).toBe(
      'A server error occurred. Please try again shortly.',
    );
  });

  it('falls back safely for unknown shapes', () => {
    expect(mapApiErrorToMessage({ foo: 'bar' })).toBe('Something went wrong. Please try again.');
    expect(mapApiErrorToMessage(null)).toBe('Something went wrong. Please try again.');
  });
});

describe('announceError', () => {
  function createMockDocument() {
    const elementsById = new Map<string, MockElement>();
    const bodyChildren: MockElement[] = [];

    class MockElement {
      id = '';
      textContent = '';
      attributes = new Map<string, string>();
      style: Record<string, string> = {};

      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      }

      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
      }
    }

    const body = {
      appendChild(element: MockElement) {
        bodyChildren.push(element);
        if (element.id) {
          elementsById.set(element.id, element);
        }
        return element;
      },
    };

    const document = {
      body,
      createElement: () => new MockElement(),
      getElementById: (id: string) => elementsById.get(id) ?? null,
      querySelectorAll: (selector: string) => {
        if (selector.startsWith('#')) {
          const match = elementsById.get(selector.slice(1));
          return match ? [match] : [];
        }

        return [];
      },
    };

    return { document, bodyChildren };
  }

  it('creates a single hidden live region and announces the message', async () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const { document } = createMockDocument();

    // @ts-expect-error test shim
    globalThis.document = document;
    // @ts-expect-error test shim
    globalThis.window = globalThis;

    announceError('Upload failed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const region = document.getElementById('app-error-live-region');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('role')).toBe('alert');
    expect(region?.getAttribute('aria-live')).toBe('assertive');
    expect(region?.getAttribute('aria-atomic')).toBe('true');
    expect(region?.textContent).toBe('Upload failed');

    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  it('reuses the existing live region', async () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const { document } = createMockDocument();

    // @ts-expect-error test shim
    globalThis.document = document;
    // @ts-expect-error test shim
    globalThis.window = globalThis;

    announceError('First error');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const firstRegion = document.getElementById('app-error-live-region');

    announceError('Second error');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const regions = document.querySelectorAll('#app-error-live-region');
    expect(regions).toHaveLength(1);
    expect(document.getElementById('app-error-live-region')).toBe(firstRegion);
    expect(firstRegion?.textContent).toBe('Second error');

    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  it('does nothing when given an empty message', async () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const { document } = createMockDocument();

    // @ts-expect-error test shim
    globalThis.document = document;
    // @ts-expect-error test shim
    globalThis.window = globalThis;

    announceError('   ');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.getElementById('app-error-live-region')).toBeNull();

    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  it('no-ops safely without document', () => {
    const originalDocument = globalThis.document;

    // @ts-expect-error testing SSR-like environment
    delete globalThis.document;

    expect(() => announceError('Server-side error')).not.toThrow();

    globalThis.document = originalDocument;
  });
});
