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
        { x: 24, y: 30, width: 360, height: 450 },
      );

      return React.createElement('div', { 'data-testid': 'integration-cropper' }, 'Mock cropper');
    },
  };
});

import CropperModal from '../../src/components/cropper-modal';

describe('cropper modal integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads guidelines and saves a cropped photo through the API flow', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requirements: [{ id: 'plain', label: 'Plain background', description: 'Use a plain background.' }],
          visuals: [{ id: 'visual', label: 'Guide', assetUrl: '/guide.svg', altText: 'Guide overlay' }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          croppedImageId: 'crop-22',
          url: 'https://cdn.example.com/crop-22.jpg',
          complianceStatus: 'cropped',
        }),
      } as Response);

    const React = await import('react');
    const ReactDOMClient = await import('react-dom/client');
    const { act } = await import('react');

    const onCropSaved = vi.fn();
    const onClose = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CropperModal, {
          imageId: 'image-22.jpg',
          imageSrc: 'https://cdn.example.com/original.jpg',
          isOpen: true,
          onClose,
          onCropSaved,
        }),
      );
      await Promise.resolve();
    });

    await act(async () => {
      const saveButton = container.querySelector('[aria-label="Save cropped photo"]') as HTMLButtonElement;
      saveButton.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onCropSaved).toHaveBeenCalledWith({
      croppedImageId: 'crop-22',
      url: 'https://cdn.example.com/crop-22.jpg',
      complianceStatus: 'cropped',
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
