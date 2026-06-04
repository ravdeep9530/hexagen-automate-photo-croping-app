import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhotoStatus } from '../../../src/hooks/use-photo-status';

describe('usePhotoStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches the current photo status on mount', async () => {
    const updates: Array<ReturnType<typeof usePhotoStatus>> = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'session-1',
        hasUploaded: true,
        hasCropped: false,
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
        croppedPhotoUrl: null,
        complianceStatus: 'uploaded',
      }),
    } as Response);

    function TestComponent() {
      updates.push(usePhotoStatus('session-1', { pollIntervalMs: 1000 }));
      return null;
    }

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(TestComponent));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    const latest = updates.at(-1);

    expect(fetchMock).toHaveBeenCalledWith('/api/photoStatus?sessionId=session-1');
    expect(latest?.isLoading).toBe(false);
    expect(latest?.hasUploaded).toBe(true);
    expect(latest?.uploadedPhotoUrl).toBe('https://cdn.example.com/uploaded.jpg');
    expect(latest?.error).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it('polls for updates while a session is active', async () => {
    const updates: Array<ReturnType<typeof usePhotoStatus>> = [];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'session-2',
          hasUploaded: true,
          hasCropped: false,
          uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
          croppedPhotoUrl: null,
          complianceStatus: 'uploaded',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'session-2',
          hasUploaded: true,
          hasCropped: true,
          uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
          croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
          complianceStatus: 'cropped',
        }),
      } as Response);

    function TestComponent() {
      updates.push(usePhotoStatus('session-2', { pollIntervalMs: 1000 }));
      return null;
    }

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(TestComponent));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    const latest = updates.at(-1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(latest?.hasCropped).toBe(true);
    expect(latest?.croppedPhotoUrl).toBe('https://cdn.example.com/cropped.jpg');

    await act(async () => {
      root.unmount();
    });
  });

  it('surfaces fetch errors', async () => {
    const updates: Array<ReturnType<typeof usePhotoStatus>> = [];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Session not found' }),
    } as Response);

    function TestComponent() {
      updates.push(usePhotoStatus('missing-session', { pollIntervalMs: 1000 }));
      return null;
    }

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(TestComponent));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    const latest = updates.at(-1);

    expect(latest?.isLoading).toBe(false);
    expect(latest?.error).toBe('Session not found');
    expect(latest?.hasUploaded).toBe(false);
    expect(latest?.hasCropped).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it('does not fetch when the session id is empty', async () => {
    const updates: Array<ReturnType<typeof usePhotoStatus>> = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    function TestComponent() {
      updates.push(usePhotoStatus('', { pollIntervalMs: 1000 }));
      return null;
    }

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(TestComponent));
      await Promise.resolve();
    });

    const latest = updates.at(-1);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(latest?.isActive).toBe(false);
    expect(latest?.sessionId).toBe('');
    expect(latest?.error).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });
});
