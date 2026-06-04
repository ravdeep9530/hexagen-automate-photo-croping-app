import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('photo status page integration', () => {
  it('renders the fetched status details and URLs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'demo-session',
        hasUploaded: true,
        hasCropped: true,
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
        croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
        complianceStatus: 'cropped',
      }),
    } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');
    const { default: Page } = await import('../../src/app/page');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(React.createElement(Page));
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Uploaded');
    expect(container.textContent).toContain('Cropped');
    expect(container.textContent).toContain('cropped');
    expect(container.innerHTML).toContain('https://cdn.example.com/uploaded.jpg');
    expect(container.innerHTML).toContain('https://cdn.example.com/cropped.jpg');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
