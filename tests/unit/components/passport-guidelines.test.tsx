import { afterEach, describe, expect, it, vi } from 'vitest';

import { PassportGuidelines } from '../../../src/components/passport-guidelines';

describe('PassportGuidelines', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loading state before the request resolves', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(PassportGuidelines));
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Loading passport photo guidelines');
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('Loading passport photo guidelines');

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => ({ requirements: [], visuals: [] }),
      } as Response);
      await Promise.resolve();
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders requirements and visuals when the request succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        requirements: [
          {
            id: 'plain-background',
            label: 'Plain background',
            description: 'Use a plain light-colored background with no patterns.',
          },
        ],
        visuals: [
          {
            id: 'approved-example',
            label: 'Approved example',
            assetUrl: 'https://assets.example.com/approved-example.svg',
            altText: 'Approved passport photo example with a centered face and plain background',
          },
        ],
      }),
    } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(PassportGuidelines));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/photoGuidelines');
    expect(container.querySelector('[aria-label="Passport photo guidelines"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Passport guideline details"]')).not.toBeNull();
    expect(container.textContent).toContain('Passport photo guidelines loaded.');
    expect(container.textContent).toContain('Requirements');
    expect(container.textContent).toContain('Plain background');
    expect(container.textContent).toContain('Visual guidance');

    const image = container.querySelector('img');
    expect(image?.getAttribute('alt')).toBe(
      'Approved passport photo example with a centered face and plain background',
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders an empty state when no requirements or visuals are returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requirements: [], visuals: [] }),
    } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(PassportGuidelines));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('No passport photo guidelines are available right now.');
    expect(container.textContent).toContain('Guideline details will appear here when the service returns requirement and visual data.');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders an error state and retries the request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Service unavailable' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requirements: [
            {
              id: 'face-camera',
              label: 'Face the camera directly',
              description: 'Look straight into the camera with your eyes open.',
            },
          ],
          visuals: [],
        }),
      } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(PassportGuidelines));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Unable to load guidelines. Service unavailable');

    const retryButton = container.querySelector('[aria-label="Retry loading passport photo guidelines"]');
    expect(retryButton).not.toBeNull();

    await act(async () => {
      (retryButton as HTMLButtonElement).click();
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Face the camera directly');
    expect(container.textContent).toContain('Passport photo guidelines loaded.');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
