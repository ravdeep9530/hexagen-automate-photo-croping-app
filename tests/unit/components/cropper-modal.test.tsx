import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-easy-crop', async () => {
  const React = await import('react');

  return {
    default: ({
      onCropComplete,
    }: {
      onCropComplete?: (croppedArea: unknown, croppedAreaPixels: unknown) => void;
    }) => {
      onCropComplete?.(
        { width: 80, height: 100, x: 0, y: 0 },
        { x: 12, y: 18, width: 320, height: 400 },
      );

      return React.createElement('div', { 'data-testid': 'easy-crop' }, 'Mock cropper');
    },
  };
});

import CropperModal from '../../../src/components/cropper-modal';

describe('CropperModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with cropper, preview, and loaded guidelines', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        requirements: [
          { id: 'face', label: 'Center face', description: 'Keep your face centered in the frame.' },
        ],
        visuals: [
          { id: 'overlay', label: 'Overlay', assetUrl: '/overlay.svg', altText: 'Passport overlay' },
        ],
      }),
    } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const onClose = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CropperModal, {
          imageId: 'image-1.jpg',
          imageSrc: 'https://cdn.example.com/photo.jpg',
          isOpen: true,
          onClose,
        }),
      );
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Photo cropper"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="easy-crop"]')).not.toBeNull();
    expect(container.querySelector('img[alt="Uploaded photo preview"]')).not.toBeNull();
    expect(container.textContent).toContain('Center face');
    expect(container.textContent).toContain('Adjust the crop and save your photo.');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('supports keyboard navigation and escape to close', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requirements: [], visuals: [] }),
    } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const onClose = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CropperModal, {
          imageId: 'image-2.jpg',
          imageSrc: 'https://cdn.example.com/photo-2.jpg',
          isOpen: true,
          onClose,
        }),
      );
      await Promise.resolve();
    });

    const cropper = container.querySelector('[aria-label="Photo cropper"]') as HTMLDivElement;
    const zoomRange = container.querySelector('input[type="range"]') as HTMLInputElement;

    expect(zoomRange.value).toBe('1');

    await act(async () => {
      cropper.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    });

    expect(Number(zoomRange.value)).toBeGreaterThan(1);

    await act(async () => {
      cropper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('posts crop params and calls onCropSaved on success', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requirements: [], visuals: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          croppedImageId: 'cropped-1',
          url: 'https://cdn.example.com/cropped.jpg',
          complianceStatus: 'cropped',
        }),
      } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const onClose = vi.fn();
    const onCropSaved = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CropperModal, {
          imageId: 'image-3.jpg',
          imageSrc: 'https://cdn.example.com/photo-3.jpg',
          isOpen: true,
          onClose,
          onCropSaved,
        }),
      );
      await Promise.resolve();
    });

    const saveButton = container.querySelector('[aria-label="Save cropped photo"]') as HTMLButtonElement;

    await act(async () => {
      saveButton.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/saveCroppedPhoto', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageId: 'image-3.jpg',
        x: 12,
        y: 18,
        width: 320,
        height: 400,
        aspectRatio: 0.8,
      }),
    });
    expect(onCropSaved).toHaveBeenCalledWith({
      croppedImageId: 'cropped-1',
      url: 'https://cdn.example.com/cropped.jpg',
      complianceStatus: 'cropped',
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders guideline and save error states', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Guideline service unavailable' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requirements: [], visuals: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unable to crop image' }),
      } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CropperModal, {
          imageId: 'image-4.jpg',
          imageSrc: 'https://cdn.example.com/photo-4.jpg',
          isOpen: true,
          onClose: vi.fn(),
        }),
      );
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Unable to load guidelines. Guideline service unavailable');

    const retryButton = container.querySelector('[aria-label="Retry loading crop guidelines"]') as HTMLButtonElement;
    await act(async () => {
      retryButton.click();
      await Promise.resolve();
    });

    const saveButton = container.querySelector('[aria-label="Save cropped photo"]') as HTMLButtonElement;
    await act(async () => {
      saveButton.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(container.textContent).toContain('Unable to crop image');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
