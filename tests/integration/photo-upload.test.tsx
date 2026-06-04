import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/components/cropper-modal', async () => {
  const React = await import('react');

  return {
    default: ({
      isOpen,
      imageSrc,
      imageId,
      onCropSaved,
    }: {
      isOpen: boolean;
      imageSrc: string;
      imageId: string;
      onCropSaved?: (result: { croppedImageId: string; url: string; complianceStatus?: string }) => void;
    }) =>
      isOpen
        ? React.createElement(
            'div',
            { 'aria-label': 'Integration cropper modal' },
            React.createElement('span', null, imageSrc),
            React.createElement('span', null, imageId),
            React.createElement(
              'button',
              {
                'aria-label': 'Integration save crop',
                onClick: () => {
                  onCropSaved?.({
                    croppedImageId: 'crop-9',
                    url: 'https://cdn.example.com/crop-9.jpg',
                    complianceStatus: 'cropped',
                  });
                },
                type: 'button',
              },
              'Complete crop',
            ),
          )
        : null,
  };
});

class MockXMLHttpRequest {
  static latestInstance: MockXMLHttpRequest | null = null;

  status = 0;
  response: unknown = null;
  responseType = '';
  method: string | null = null;
  url: string | null = null;
  body: FormData | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload = {
    onprogress: null as ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null,
  };

  constructor() {
    MockXMLHttpRequest.latestInstance = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: Document | XMLHttpRequestBodyInit | null | undefined) {
    this.body = body as FormData;
  }

  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }

  succeed(response: unknown, status = 200) {
    this.status = status;
    this.response = response;
    this.onload?.();
  }

  fail() {
    this.onerror?.();
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  MockXMLHttpRequest.latestInstance = null;
});

describe('photo upload integration', () => {
  it('uploads a valid file, opens cropper, and renders cropped success state', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);

    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    const { act } = React;
    const { PhotoUpload } = await import('../../src/components/photo-upload');

    const file = new File(['image'], 'portrait.jpg', { type: 'image/jpeg' });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    act(() => {
      root.render(React.createElement(PhotoUpload));
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const xhr = MockXMLHttpRequest.latestInstance;
    expect(xhr).not.toBeNull();
    expect(xhr?.method).toBe('POST');
    expect(xhr?.url).toBe('/api/uploadPhoto');
    expect(xhr?.body).toBeInstanceOf(FormData);

    act(() => {
      xhr?.emitProgress(50, 100);
    });

    expect(container.textContent).toContain('Upload progress: 50%');
    expect(container.textContent).toContain('Uploading portrait.jpg');

    act(() => {
      xhr?.succeed({
        uploadedPhotoUrl: 'https://cdn.example.com/portrait.jpg',
        imageId: 'image-1.jpg',
      });
    });

    expect(container.textContent).toContain('Upload complete.');
    expect(container.querySelector('[aria-label="Integration cropper modal"]')).not.toBeNull();
    expect(container.textContent).toContain('https://cdn.example.com/portrait.jpg');
    expect(container.textContent).toContain('image-1.jpg');

    act(() => {
      (container.querySelector('[aria-label="Integration save crop"]') as HTMLButtonElement).click();
    });

    expect(container.textContent).toContain('Cropped photo saved.');
    expect(container.innerHTML).toContain('https://cdn.example.com/crop-9.jpg');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders API and network errors for failed uploads', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);

    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    const { act } = React;
    const { PhotoUpload } = await import('../../src/components/photo-upload');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    const file = new File(['image'], 'portrait.png', { type: 'image/png' });

    act(() => {
      root.render(React.createElement(PhotoUpload));
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    act(() => {
      MockXMLHttpRequest.latestInstance?.succeed({ message: 'Storage unavailable' }, 500);
    });

    expect(container.textContent).toContain('Storage unavailable');

    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    act(() => {
      MockXMLHttpRequest.latestInstance?.fail();
    });

    expect(container.textContent).toContain('Upload failed. Please check your connection and try again.');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
